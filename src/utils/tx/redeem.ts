import { decodeAddress } from '@polkadot/util-crypto';
import { memoize } from 'lodash';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../../config';
import { RedeemDarwiniaToken, RedeemDeposit, RedeemDVMToken, Token, Tx, TxFn } from '../../model';
import { convertToDvm } from '../helper';
import { entrance } from '../network';
import { buf2hex, getContractTxObs } from './common';

/**
 * @description darwinia <- ethereum
 */
export const redeemDarwiniaToken: TxFn<RedeemDarwiniaToken> = ({ sender, transfer, asset, amount, recipient }) => {
  const contractAddress = transfer.from.tokenContract[asset as Token] as string;

  recipient = buf2hex(decodeAddress(recipient, false, transfer.to.ss58Prefix!).buffer);
  amount = Web3.utils.toWei(amount, 'ether');

  return getContractTxObs(contractAddress, (contract) =>
    contract.methods
      .transferFrom(sender, transfer.from.tokenContract.issuingDarwinia, amount, recipient)
      .send({ from: sender })
  );
};

/**
 * @description darwinia <- ethereum
 */
export const redeemDeposit: TxFn<RedeemDeposit> = ({ transfer: { to, from }, recipient, sender, deposit }) => {
  recipient = buf2hex(decodeAddress(recipient, false, to.ss58Prefix!).buffer);

  return getContractTxObs(
    from?.tokenContract.bankDarwinia as string,
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
    from.erc20Token.bankingAddress,
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

  return getContractTxObs(
    mappingAddress,
    (contract) => {
      const val = Web3.utils.toHex('50000000000000000000');

      return contract.methods
        .burnAndRemoteUnlockWaitingConfirm(specVersion, weight, asset.address, receiver, amount)
        .send({ from: sender, gas: '21000000', gasPrice: '50000000000', value: val });
    },
    abi.mappingTokenABI
  );
}

export interface S2SInfo {
  specVersion: string;
  mappingAddress: string;
}

const s2sMappingParams: (rpc: string) => Promise<S2SInfo> = async (rpc: string) => {
  const api = entrance.polkadot.getInstance(rpc);

  await api.isReady;

  const mappingAddress = (await api.query.substrate2SubstrateIssuing.mappingFactoryAddress()).toString();
  const specVersion = api.runtimeVersion.specVersion.toString();

  return { specVersion, mappingAddress };
};

export const getS2SMappingParams = memoize(s2sMappingParams);
