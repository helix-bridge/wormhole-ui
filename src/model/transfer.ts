import { NetConfig } from './network';

export interface TransferValue {
  from: NetConfig | null;
  to: NetConfig | null;
}

export type TransferFormValues<T = Record<string, unknown>> = { transfer: TransferValue } & T;
