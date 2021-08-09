import { decodeAddress } from '@polkadot/util-crypto';
import { of } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../../config';
import {
  DeepRequired,
  E2D,
  NoNullTransferNetwork,
  RequiredPartial,
  Token,
  TransferFormValues,
  TxFn,
} from '../../model';
import { buf2hex, getContractTxObs } from './common';

export type RedeemEth = TransferFormValues<
  DeepRequired<E2D, ['sender' | 'asset' | 'amount' | 'recipient']>,
  NoNullTransferNetwork
>;

export type RedeemDeposit = TransferFormValues<
  DeepRequired<E2D, ['sender' | 'deposit' | 'recipient']>,
  NoNullTransferNetwork
>;

export const approveRingToIssuing: TxFn<
  RequiredPartial<TransferFormValues<E2D, NoNullTransferNetwork>, 'sender' | 'transfer'>
> = ({ sender, transfer }) => {
  const hardCodeAmount = '100000000000000000000000000';

  return getContractTxObs(transfer.from.tokenContract.ring as string, (contract) =>
    contract.methods
      .approve(transfer.from.tokenContract.issuingDarwinia, Web3.utils.toWei(hardCodeAmount))
      .send({ from: sender })
  );
};

export const redeemToken: TxFn<RedeemEth> = ({ sender, transfer, asset, amount, recipient }) => {
  const contractAddress = transfer.from.tokenContract[asset as Token] as string;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  recipient = buf2hex(decodeAddress(recipient, false, transfer.to.ss58Prefix!).buffer);
  amount = Web3.utils.toWei(amount, 'ether');

  return getContractTxObs(contractAddress, (contract) =>
    contract.methods
      .transferFrom(sender, transfer.from.tokenContract.issuingDarwinia, amount, recipient)
      .send({ from: sender })
  );
};

export const redeemDeposit: TxFn<RedeemDeposit> = ({ transfer: { to, from }, recipient, sender, deposit }) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  recipient = buf2hex(decodeAddress(recipient, false, to.ss58Prefix!).buffer);

  return getContractTxObs(
    from?.tokenContract.bankDarwinia as string,
    (contract) => contract.methods.burnAdnRedeem(deposit, recipient).send({ from: sender }),
    abi.bankABI
  );
};

/**
 * TODO
 */
export const redeemErc20: TxFn<RedeemEth> = (value) => {
  console.info(value);

  return of({ status: 'finalized', hash: '' });
};
