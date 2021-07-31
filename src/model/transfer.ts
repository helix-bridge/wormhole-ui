import { FormInstance } from 'antd';
import { Deposit } from './evolution';
import { NetConfig, Token } from './network';
import { DeepRequired } from './util';

/* ---------------------------------------------------Components props--------------------------------------------------- */

export type TransferFormValues<T = Record<string, unknown>, U = TransferNetwork> = { transfer: U } & T;

export interface CustomFormControlProps<T = string> {
  value?: T;
  onChange?: (value: T) => void;
}

export interface BridgeFormProps {
  form: FormInstance<TransferFormValues>;
  setSubmit: React.Dispatch<React.SetStateAction<(value: TransferFormValues) => void>>;
}

/* ---------------------------------------------------Bridge elements--------------------------------------------------- */

export interface TransferNetwork {
  from: NetConfig | null;
  to: NetConfig | null;
}

export type NoNullTransferNetwork = DeepRequired<TransferNetwork, ['from' | 'to']>;

interface TransferParty {
  sender?: string;
  recipient?: string;
}

export interface TransferAsset<T> {
  asset?: T;
  amount?: string;
  isErc20?: boolean;
}

type Transfer<T> = (T extends Array<unknown> ? { assets?: TransferAsset<T[0]>[] } : TransferAsset<T>) & TransferParty;

/* ---------------------------------------------------E2D--------------------------------------------------- */

export type E2DAsset = Exclude<Token, 'native'> | 'deposit';

export type E2D = Transfer<E2DAsset> & { deposit?: Deposit };

/* ---------------------------------------------------D2E--------------------------------------------------- */

export type D2EAsset = Exclude<Token, 'native'>;

export type D2E = Transfer<D2EAsset[]>;

/* ---------------------------------------------------Bridge--------------------------------------------------- */

export type Bridges = E2D & D2E;
