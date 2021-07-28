import { useCallback, useState } from 'react';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { E2DItems } from '../components/bridge/Ethereum2Darwinia';
import { abi, LONG_DURATION } from '../config';
import { NetConfig, NoNullFields, RequiredPick, TransferFormValues, TransferValue, TxStatus } from '../model';

export interface Tx {
  status: TxStatus;
  hash?: string;
  error?: string;
}

/**
 * TODO: web3 types
 */
export interface Receipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  contractAddress: string;
  cumulativeGasUsed: number;
  gasUsed: number;
}

type ApproveFn<T> = (value: T, config: NetConfig) => Observable<Tx>;

const approveRingToIssuing: ApproveFn<RequiredPick<E2DItems, 'sender' | 'asset' | 'amount'>> = (
  { sender, amount },
  config
) => {
  const web3js = new Web3(window.ethereum || window.web3.currentProvider);
  const contract = new web3js.eth.Contract(abi.tokenABI, config.tokenContract.ring);

  return new Observable((observer) => {
    observer.next({ status: 'signing' });

    contract.methods
      .approve(config.tokenContract.issuingDarwinia, Web3.utils.toWei(amount))
      .send({ from: sender })
      .on('transactionHash', (hash: string) => {
        observer.next({ status: 'queued', hash });
      })
      .on('confirmation', (_: number, { transactionHash }: Receipt) => {
        observer.next({ status: 'completed', hash: transactionHash });
      })
      .on('receipt', ({ transactionHash }: Receipt) => {
        observer.next({ status: 'finalized', hash: transactionHash });
        setTimeout(() => observer.complete(), LONG_DURATION);
      })
      .catch((error: { code: number; message: string }) => {
        observer.error({ status: 'error', error: error.message });
      });
  });
};

export function useTx() {
  const [tx, setTx] = useState<Tx | null>(null);
  const approve: <T>(value: TransferFormValues<T>) => void = useCallback(
    (value) => {
      const { transfer, ...other } = value;
      const { from, to } = transfer as NoNullFields<TransferValue>;

      if ((from.name === 'ropsten' && to.name === 'pangolin') || (from.name === 'darwinia' && to.name === 'darwinia')) {
        approveRingToIssuing(other as unknown as Required<E2DItems>, from).subscribe({
          next: (txt) => setTx(txt),
          error: (txt) => {
            setTx(txt);

            setTimeout(() => setTx(null), LONG_DURATION);
          },
          complete: () => {
            setTx(null);
          },
        });
      }
    },
    [setTx]
  );

  return { approve, tx };
}
