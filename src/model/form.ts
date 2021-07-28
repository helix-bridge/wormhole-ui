import { FormInstance } from 'antd';
import { TransferFormValues } from './transfer';

export interface CustomFormControlProps<T = string> {
  value?: T;
  onChange?: (value: T) => void;
}

export interface BridgeFormProps {
  form: FormInstance<TransferFormValues>;
  lock?: boolean;
}
