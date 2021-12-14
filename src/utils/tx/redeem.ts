import { decodeAddress } from '@polkadot/util-crypto';
import { memoize } from 'lodash';
import { from as fromObs, Observable, switchMap } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../../config';
import { RedeemDarwiniaToken, RedeemDeposit, RedeemDVMToken, Tx, TxFn } from '../../model';
import { convertToDvm } from '../helper';
import { entrance, waitUntilConnected } from '../network';
import { buf2hex, getContractTxObs } from './common';

/**
 * @description darwinia <- ethereum
 * Because of the ring was released in advance on ethereum, so the action is issuing, but follow the Protocol Overview, it should be redeem.
 */
export const redeemDarwiniaToken: TxFn<RedeemDarwiniaToken> = ({ sender, transfer, asset, amount, recipient }) => {
  const contractAddress = transfer.from.contracts.e2d[asset as 'ring' | 'kton'] as string;

  recipient = buf2hex(decodeAddress(recipient, false, transfer.to.ss58Prefix!).buffer);

  return getContractTxObs(contractAddress, (contract) =>
    contract.methods.transferFrom(sender, transfer.from.contracts.e2d.issuing, amount, recipient).send({ from: sender })
  );
};

/**
 * @description darwinia <- ethereum
 */
export const redeemDeposit: TxFn<RedeemDeposit> = ({ transfer: { to, from }, recipient, sender, deposit }) => {
  recipient = buf2hex(decodeAddress(recipient, false, to.ss58Prefix!).buffer);

  return getContractTxObs(
    from?.contracts.e2d.redeemDeposit as string,
    (contract) => contract.methods.burnAdnRedeem(deposit, recipient).send({ from: sender }),
    abi.bankABI
  );
};

/**
 * @description ethereum <- substrate dvm
 */
export const redeemErc20: TxFn<RedeemDVMToken> = (value) => {
  const {
    asset,
    recipient,
    amount,
    transfer: { from },
    sender,
  } = value;
  const { address } = asset;

  return getContractTxObs(
    from.contracts.e2dvm.redeem,
    (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
    abi.bankErc20ABI
  );
};

/**
 * @description substrate <- substrate dvm
 */
export function redeemSubstrate(value: RedeemDVMToken, mappingAddress: string, specVersion: string): Observable<Tx> {
  const { asset, amount, sender, recipient } = value;
  const receiver = Web3.utils.hexToBytes(convertToDvm(recipient));
  const weight = '690133000';
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const contractInner = new web3.eth.Contract(abi.S2SMappingTokenABI, mappingAddress);
  const gasObs = fromObs(
    contractInner.methods
      .burnAndRemoteUnlockWaitingConfirm(specVersion, weight, asset.address, receiver, amount)
      .estimateGas({ from: sender })
  );

  return gasObs.pipe(
    switchMap((gas) =>
      getContractTxObs(
        mappingAddress,
        (contract) => {
          const val = Web3.utils.toHex('50000000000000000000');

          console.info('----->', gas);
          // @see https://github.com/darwinia-network/wormhole-ui/issues/139
          return (
            contract.methods
              .burnAndRemoteUnlockWaitingConfirm(specVersion, weight, asset.address, receiver, amount)
              // .send({ from: sender, gas });
              .send({ from: sender, gasLimit: '2000000', gasPrice: '50000000000', value: val })
          );
        },
        abi.S2SMappingTokenABI
      )
    )
  );
}

interface MappingInfo {
  specVersion?: string;
  mappingAddress: string;
}

type S2SInfo = Required<MappingInfo>;

const s2sMappingParams: (rpc: string) => Promise<S2SInfo> = async (rpc: string) => {
  const api = entrance.polkadot.getInstance(rpc);

  await waitUntilConnected(api);

  const module = rpc.includes('pangolin') ? api.query.substrate2SubstrateIssuing : api.query.fromDarwiniaIssuing;
  const mappingAddress = (await module.mappingFactoryAddress()).toString();
  const specVersion = api.runtimeVersion.specVersion.toString();

  return { specVersion, mappingAddress };
};

export const getS2SMappingParams = memoize(s2sMappingParams);

export const getErc20MappingPrams: (rpc: string) => Promise<MappingInfo> = (_: string) => {
  return Promise.resolve({ mappingAddress: '0xcB8531Bc0B7C8F41B55CF4E94698C37b130597B9' });
};
