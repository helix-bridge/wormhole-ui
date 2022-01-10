import { Modal, ModalFuncProps, ModalProps } from 'antd';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { Trans } from 'react-i18next';
import BN from 'bn.js';
import { EMPTY, finalize, Observable, Observer, switchMap, tap } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../../config';
import {
  DVMPayload,
  Erc20Token,
  Ethereum2DarwiniaPayload,
  RequiredPartial,
  CrossChainPayload,
  Tx,
  TxFn,
} from '../../model';
import { empty } from '../helper';
import { entrance } from '../network';

/**
 * TODO: web3 types
 */
interface Receipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  contractAddress: string;
  cumulativeGasUsed: number;
  gasUsed: number;
}

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
export function getContractTxObs(
  contractAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (contract: Contract) => any,
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
        .on('receipt', ({ transactionHash }: Receipt) => {
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

  return getContractTxObs(tokenAddress, (contract) =>
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
