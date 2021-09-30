import { decodeAddress } from '@polkadot/util-crypto';
import Web3 from 'web3';
import { abi } from '../../config';
import {
  DeepRequired,
  Ethereum2DarwiniaTransfer,
  NoNullTransferNetwork,
  Token,
  TransferFormValues,
  TxFn,
} from '../../model';
import { buf2hex, getContractTxObs } from './common';

export type RedeemDarwiniaToken = TransferFormValues<
  DeepRequired<Ethereum2DarwiniaTransfer, ['sender' | 'asset' | 'amount' | 'recipient']>,
  NoNullTransferNetwork
>;

export type RedeemDeposit = TransferFormValues<
  DeepRequired<Ethereum2DarwiniaTransfer, ['sender' | 'deposit' | 'recipient']>,
  NoNullTransferNetwork
>;

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

export const redeemDeposit: TxFn<RedeemDeposit> = ({ transfer: { to, from }, recipient, sender, deposit }) => {
  recipient = buf2hex(decodeAddress(recipient, false, to.ss58Prefix!).buffer);

  return getContractTxObs(
    from?.tokenContract.bankDarwinia as string,
    (contract) => contract.methods.burnAdnRedeem(deposit, recipient).send({ from: sender }),
    abi.bankABI
  );
};
