import { ApiPromise } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { Modal, ModalFuncProps, ModalProps } from 'antd';
import BN from 'bn.js';
import { upperFirst } from 'lodash';
import { Trans } from 'react-i18next';
import { EMPTY, filter, finalize, from, map, Observable, Observer, switchMap, take, tap, zip } from 'rxjs';
import Web3 from 'web3';
import { PromiEvent, TransactionConfig, TransactionReceipt } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { Ethereum2DarwiniaPayload, EthereumDarwiniaBridgeConfig } from '../../bridges/ethereum-darwinia/model';
import { abi } from '../../config/abi';
import {
  CrossChainDirection,
  CrossChainPayload,
  DVMPayload,
  Erc20Token,
  LockEventsStorage,
  RequiredPartial,
  Tx,
  TxFn,
} from '../../model';
import { getBridge } from '../bridge';
import { empty, encodeBlockHeader } from '../helper';
import { ClaimNetworkPrefix, encodeMMRRootMessage, getMMR } from '../mmr';
import { connect, entrance, waitUntilConnected } from '../network';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModalSpyFn<T = any> = (observer: Observer<T>, closeFn: () => void) => void;

type IModalFuncs = {
  afterDisappear?: ModalSpyFn;
  handleOk?: ModalSpyFn;
  handleCancel?: ModalSpyFn;
};

export const txModalConfig: (props: Partial<ModalFuncProps>) => ModalProps = (props) => ({
  okCancel: true,
  cancelText: <Trans>Cancel</Trans>,
  okText: <Trans>Confirm</Trans>,
  okButtonProps: { size: 'large' },
  cancelButtonProps: { size: 'large' },
  width: 520,
  centered: true,
  className: 'confirm-modal',
  icon: null,
  destroyOnClose: true,
  ...props,
});

const { confirm } = Modal;

export function buf2hex(buffer: ArrayBuffer) {
  // eslint-disable-next-line no-magic-numbers
  return '0x' + Array.prototype.map.call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2)).join('');
}

export function applyModal(props: RequiredPartial<ModalFuncProps, 'content'> & IModalFuncs): { destroy: () => void } {
  const config = txModalConfig(props);

  return confirm(config);
}

export function applyModalObs<T = boolean>(
  props: RequiredPartial<ModalFuncProps, 'content'> & IModalFuncs
): Observable<T | boolean> {
  const { handleOk } = props;
  const config = txModalConfig(props);
  const { afterClose, ...others } = config;

  return new Observable((observer) => {
    confirm({
      ...others,
      onCancel: (close) => {
        observer.next(false);
        close();
      },
      onOk: (close) => {
        if (handleOk) {
          handleOk(observer, close);
        } else {
          observer.next(true);
          close();
        }
      },
      afterClose: () => {
        if (afterClose) {
          afterClose();
        }
      },
    });
  });
}

export type AfterTxCreator = (tx: Tx) => () => void;

export function createTxWorkflow(
  before: Observable<boolean>,
  txObs: Observable<Tx>,
  after: AfterTxCreator
): Observable<Tx> {
  let finish: () => void = empty;

  return before.pipe(
    switchMap((confirmed) =>
      confirmed
        ? txObs.pipe(
            tap((tx) => {
              if (tx.status === 'finalized') {
                finish = after(tx);
              }
            }),
            finalize(() => finish())
          )
        : EMPTY
    )
  );
}

/**
 * @param contractAddress - Contract address in ethereum
 * @param fn - Contract method to be call, will receive the contract instance as the incoming parameter;
 * @param contractAbi - Contract ABI
 * @returns An Observable which will emit the tx events that includes signing, queued, finalized and error.
 */
export function genEthereumContractTxObs(
  contractAddress: string,
  fn: (contract: Contract) => PromiEvent<unknown>,
  contractAbi: AbiItem | AbiItem[] = abi.tokenABI
): Observable<Tx> {
  return new Observable((observer) => {
    try {
      const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
      const contract = new web3.eth.Contract(contractAbi, contractAddress);

      observer.next({ status: 'signing' });

      fn(contract)
        .on('transactionHash', (hash: string) => {
          observer.next({ status: 'queued', hash });
        })
        .on('receipt', ({ transactionHash }: TransactionReceipt) => {
          observer.next({ status: 'finalized', hash: transactionHash });
          observer.complete();
        })
        .catch((error: { code: number; message: string }) => {
          observer.error({ status: 'error', error: error.message });
        });
    } catch (error) {
      console.warn('%c contract tx observable error', 'font-size:13px; background:pink; color:#bf2c9f;', error);
      observer.error({ status: 'error', error: 'Contract construction/call failed!' });
    }
  });
}

export function genEthereumTransactionObs(params: TransactionConfig): Observable<Tx> {
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);

  return new Observable((observer) => {
    const tx = web3.eth.sendTransaction(params);

    tx.on('transactionHash', (hash) => {
      observer.next({ status: 'queued', hash });
    })
      .on('receipt', ({ transactionHash }: TransactionReceipt) => {
        observer.next({ status: 'finalized', hash: transactionHash });
        observer.complete();
      })
      .on('error', (error) => {
        observer.error({ status: 'error', error: error.message });
      });
  });
}

export const approveToken: TxFn<
  RequiredPartial<CrossChainPayload<Ethereum2DarwiniaPayload & DVMPayload>, 'sender'> & {
    tokenAddress?: string;
    spender?: string;
    sendOptions?: { gas: string; gasPrice: string };
  }
> = ({ sender, tokenAddress, spender, sendOptions }) => {
  if (!tokenAddress) {
    throw new Error(`Can not approve the token with address ${tokenAddress}`);
  }

  if (!spender) {
    throw new Error(`No spender account set`);
  }

  const hardCodeAmount = '100000000000000000000000000';
  const params = sendOptions ? { from: sender, ...sendOptions } : { from: sender };

  return genEthereumContractTxObs(tokenAddress, (contract) =>
    contract.methods.approve(spender, Web3.utils.toWei(hardCodeAmount)).send(params)
  );
};

export async function getAllowance(sender: string, spender: string, token: Erc20Token | null): Promise<BN> {
  if (!token) {
    return Web3.utils.toBN(0);
  }

  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const erc20Contract = new web3.eth.Contract(abi.tokenABI, token.address);
  const allowanceAmount = await erc20Contract.methods.allowance(sender, spender).call();

  return Web3.utils.toBN(allowanceAmount || 0);
}

/* -------------------------------------------Inner Helper Fn---------------------------------------------- */

function getD2ELockEventsStorageKey(blockNumber: number, lockEvents: LockEventsStorage[] = []) {
  const matchedStorageKey = lockEvents?.find(
    (item) => item.min <= blockNumber && (item.max === null || item?.max >= blockNumber)
  );

  return matchedStorageKey?.key;
}

/* -------------------------------------------Claim Token---------------------------------------------- */

interface ClaimInfo {
  direction: CrossChainDirection;
  mmrIndex: number;
  mmrRoot: string;
  mmrSignatures: string;
  blockNumber: number;
  blockHeaderStr: string;
  blockHash: string;
  meta: {
    best: number;
    MMRRoot: string;
  };
}

export async function getMPTProof(
  api: ApiPromise,
  hash = '',
  proofAddress = '0xf8860dda3d08046cf2706b92bf7202eaae7a79191c90e76297e0895605b8b457'
) {
  await waitUntilConnected(api);

  const proof = await api.rpc.state.getReadProof([proofAddress], hash);
  const registry = new TypeRegistry();

  return registry.createType('Vec<Bytes>', proof.proof.toJSON());
}

/**
 * @description darwinia -> ethereum & darwinia DVM -> ethereum  needs claim action
 */
export function claimToken({
  direction,
  mmrIndex,
  mmrRoot,
  mmrSignatures,
  blockNumber,
  blockHeaderStr,
  blockHash,
  meta: { MMRRoot, best },
}: ClaimInfo): Observable<Tx> {
  const { from: departure, to: arrival } = direction;
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const networkPrefix = upperFirst(departure.name) as ClaimNetworkPrefix;
  const apiObs = from(entrance.polkadot.getInstance(departure.provider.rpc).isReady);
  const header = encodeBlockHeader(blockHeaderStr);
  const storageKey = getD2ELockEventsStorageKey(blockNumber, bridge.config.lockEvents);
  const accountObs = connect(arrival).pipe(
    filter(({ status }) => status === 'success'),
    map(({ accounts }) => accounts[0].address),
    take(1)
  );

  return apiObs.pipe(
    switchMap((api) => {
      const eventsProofObs = from(getMPTProof(api, blockHash, storageKey)).pipe(map((str) => str.toHex()));

      return MMRRoot && best && best > blockNumber
        ? zip([from(getMMR(api, blockNumber, best, blockHash)), eventsProofObs, accountObs]).pipe(
            map(
              ([mmrProof, eventsProofStr, account]) =>
                (contract: Contract) =>
                  contract.methods
                    .verifyProof(
                      '0x' + MMRRoot,
                      best,
                      header.toHex(),
                      mmrProof.peaks,
                      mmrProof.siblings,
                      eventsProofStr
                    )
                    .send({ from: account })
            )
          )
        : zip([from(getMMR(api, blockNumber, mmrIndex, blockHash)), eventsProofObs, accountObs]).pipe(
            map(([mmrProof, eventsProofStr, account]) => {
              const mmrRootMessage = encodeMMRRootMessage({
                prefix: networkPrefix,
                methodID: '0x479fbdf9',
                index: mmrIndex,
                root: mmrRoot,
              });

              return (contract: Contract) =>
                contract.methods
                  .appendRootAndVerifyProof(
                    mmrRootMessage.toHex(),
                    mmrSignatures.split(','),
                    mmrRoot,
                    mmrIndex,
                    header.toHex(),
                    mmrProof.peaks,
                    mmrProof.siblings,
                    eventsProofStr
                  )
                  .send({ from: account });
            })
          );
    }),
    switchMap((txFn) => genEthereumContractTxObs(bridge.config.contracts.redeem || '', txFn, abi.tokenIssuingABI))
  );
}
