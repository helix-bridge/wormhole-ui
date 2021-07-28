import { TransferFormValues } from './transfer';

export interface IModalProps<T = unknown> {
  isVisible: boolean;
  confirm: (value: TransferFormValues<T>) => void;
  cancel: () => void;
}
