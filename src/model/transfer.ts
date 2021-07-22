import { Assets } from './common';
import { NetConfig } from './network';

export interface TransferValue {
  from?: NetConfig;
  to?: NetConfig;
}

export interface TransferFormValues {
  recipient: string;
  assets: Assets;
  amount: string;
  transfer: TransferValue;
}
