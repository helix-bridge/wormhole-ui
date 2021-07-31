import { Observable } from 'rxjs';
import { Bridges, TransferFormValues } from './transfer';

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
  error?: string;
}

export type TxFn<T> = (value: T) => Observable<Tx>;

export type TxConfirmComponentProps = { value: TransferFormValues<Bridges> };

export type TxSuccessComponentProps = { tx: Tx; value: TransferFormValues<Bridges> };
