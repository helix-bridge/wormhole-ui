import { FormInstance } from 'antd';
import { Subscription } from 'rxjs';
import { Unit } from 'web3-utils';
import { Erc20Token } from './erc20';
import { Deposit } from './evolution';
import { NetConfig } from './network';
import { DeepRequired } from './util';

/* ---------------------------------------------------Components props--------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransferFormValues<T = any, U = TransferNetwork> = { transfer: U } & T;

export interface CustomFormControlProps<T = string> {
  value?: T;
  onChange?: (value: T) => void;
}

export type SubmitFn = (value: TransferFormValues) => Subscription;

export interface BridgeFormProps<T extends TransferParty> {
  form: FormInstance<TransferFormValues<T>>;
  setSubmit: React.Dispatch<React.SetStateAction<SubmitFn>>;
}

/* ---------------------------------------------------Bridge elements--------------------------------------------------- */

export interface TransferNetwork {
  from: NetConfig | null;
  to: NetConfig | null;
}

export type NoNullTransferNetwork = DeepRequired<TransferNetwork, ['from' | 'to']>;

export interface TransferParty {
  recipient: string;
  sender: string;
}

/**
 * for native token, T = string;
 * for mapped token, T = Mapped Token;
 */
export interface TransferAsset<T = string> {
  amount: string;
  asset: T | null;
}

/* ---------------------------------------------------E2D--------------------------------------------------- */

type Ethereum2DarwiniaAsset = 'ring' | 'kton' | 'deposit';

export interface Ethereum2DarwiniaTransfer extends TransferParty, TransferAsset<Ethereum2DarwiniaAsset> {
  deposit?: Deposit;
}

/* ---------------------------------------------------D2E--------------------------------------------------- */

export interface Darwinia2EthereumTransfer extends TransferParty {
  assets: (TransferAsset & { checked?: boolean; unit?: Unit })[];
}

/* ---------------------------------------------------DVM--------------------------------------------------- */

export type DVMAsset = Erc20Token;

export interface DVMTransfer extends TransferParty, TransferAsset<DVMAsset> {}

/* ---------------------------------------------------s2s--------------------------------------------------- */

export type SubstrateAsset = string | Erc20Token;

export interface Substrate2SubstrateDVMTransfer extends TransferParty, TransferAsset<SubstrateAsset> {}
