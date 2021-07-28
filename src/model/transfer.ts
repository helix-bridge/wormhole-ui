import { NetConfig } from './network';

export interface TransferValue {
  from: NetConfig | null;
  to: NetConfig | null;
}

type TransferControl = { transfer: TransferValue };

export interface TransferFormValues extends TransferControl {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: string | number | any;
}
