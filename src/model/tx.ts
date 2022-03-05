import { Observable } from 'rxjs';
import { Unit } from 'web3-utils';
import { CrossChainPayload, DVMPayload } from './bridge';
import { DeepRequired } from './type-operator';

export type TxStatus =
  | 'future'
  | 'ready'
  | 'finalized'
  | 'finalitytimeout'
  | 'usurped'
  | 'dropped'
  | 'inblock'
  | 'invalid'
  | 'broadcast'
  | 'cancelled'
  | 'completed'
  | 'error'
  | 'incomplete'
  | 'queued'
  | 'qr'
  | 'retracted'
  | 'sending'
  | 'signing'
  | 'sent'
  | 'blocked';

export interface Tx {
  status: TxStatus;
  hash?: string;
  error?: Error;
}

export type TxFn<T> = (value: T) => Observable<Tx>;

export type TxConfirmComponentProps<T> = { value: CrossChainPayload<T>; unit?: Unit };

export type TxHashType = 'block' | 'extrinsic' | 'address' | 'txHash'; // consistent with the SubscanLink component props;

export type TxSuccessComponentProps<T> = {
  tx: Tx;
  value: CrossChainPayload<T>;
  hashType?: TxHashType;
  unit?: Unit;
};

export type CommonPayloadKeys = 'sender' | 'recipient' | 'amount' | 'asset';

export type DVMTxPayload = CrossChainPayload<DeepRequired<DVMPayload, [CommonPayloadKeys]>>;
