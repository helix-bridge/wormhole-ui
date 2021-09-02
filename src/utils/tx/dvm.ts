import { Observable } from 'rxjs';
import { abi } from '../../config';
import { DeepRequired, DVMTransfer, NoNullTransferNetwork, TransferFormValues, Tx, TxFn } from '../../model';
import { getContractTxObs } from './common';

export type DVMFormValues = TransferFormValues<
  DeepRequired<DVMTransfer, ['sender' | 'recipient' | 'amount' | 'asset']>,
  NoNullTransferNetwork
>;

export const redeemErc20: TxFn<DVMFormValues> = (value) => {
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

export function backingLockErc20(value: DVMFormValues): Observable<Tx> {
  const { asset, recipient, amount, transfer, sender } = value;
  const { address } = asset;

  return getContractTxObs(
    transfer.from.erc20Token.mappingAddress,
    (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
    abi.mappingTokenABI
  );
}
