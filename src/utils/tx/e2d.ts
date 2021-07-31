import { decodeAddress } from '@polkadot/util-crypto';
import { Observable, of } from 'rxjs';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { abi } from '../../config';
import {
  DeepRequired,
  E2D,
  NoNullTransferNetwork,
  RequiredPartial,
  Token,
  TransferFormValues,
  Tx,
  TxFn,
} from '../../model';
import { buf2hex } from './common';

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

export type RedeemEth = TransferFormValues<
  DeepRequired<E2D, ['sender' | 'asset' | 'amount' | 'recipient']>,
  NoNullTransferNetwork
>;

export type RedeemDeposit = TransferFormValues<
  DeepRequired<E2D, ['sender' | 'deposit' | 'recipient']>,
  NoNullTransferNetwork
>;

function createEthContractObs(
  contractAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (contract: Contract) => any,
  contractAbi: AbiItem | AbiItem[] = abi.tokenABI
): Observable<Tx> {
  return new Observable((observer) => {
    try {
      const web3js = new Web3(window.ethereum || window.web3.currentProvider);
      const contract = new web3js.eth.Contract(contractAbi, contractAddress);

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
    } catch (_) {
      observer.error({ status: 'error', error: 'Contract construction/call failed!' });
    }
  });
}

export const approveRingToIssuing: TxFn<
  RequiredPartial<TransferFormValues<E2D, NoNullTransferNetwork>, 'sender' | 'transfer'>
> = ({ sender, transfer }) => {
  const hardCodeAmount = '100000000000000000000000000';

  return createEthContractObs(transfer.from.tokenContract.ring as string, (contract) =>
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

  return createEthContractObs(contractAddress, (contract) =>
    contract.methods
      .transferFrom(sender, transfer.from.tokenContract.issuingDarwinia, amount, recipient)
      .send({ from: sender })
  );
};

export const redeemDeposit: TxFn<RedeemDeposit> = ({ transfer: { from }, recipient, sender, deposit }) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  recipient = buf2hex(decodeAddress(recipient, false, from.ss58Prefix!).buffer);

  return createEthContractObs(
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
