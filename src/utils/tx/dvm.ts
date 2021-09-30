import { Observable } from 'rxjs';
import Web3 from 'web3';
import { convertToDvm } from '..';
import { abi } from '../../config';
import { DeepRequired, DVMTransfer, NoNullTransferNetwork, TransferFormValues, Tx, TxFn } from '../../model';
import { getContractTxObs } from './common';

type DVMToken = TransferFormValues<
  DeepRequired<DVMTransfer, ['sender' | 'recipient' | 'amount' | 'asset']>,
  NoNullTransferNetwork
>;

export type RedeemDVMToken = DVMToken;
export type IssuingDVMToken = DVMToken;

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

export function backingLockErc20(value: IssuingDVMToken): Observable<Tx> {
  const { asset, recipient, amount, transfer, sender } = value;
  const { address } = asset;

  return getContractTxObs(
    transfer.from.erc20Token.mappingAddress,
    (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
    abi.mappingTokenABI
  );
}

export function backingLockS2S(value: RedeemDVMToken, mappingAddress: string, specVersion: string): Observable<Tx> {
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
