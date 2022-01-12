import { FormInstance } from 'antd';
import { Subscription } from 'rxjs';
import { Unit } from 'web3-utils';
import { Erc20Token } from '../erc20';
import { Deposit } from '../evolution';
import { ChainConfig } from '../network';
import { NullableFields } from '../type-operator';

/* ---------------------------------------------------Components props--------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CrossChainPayload<T = any> = { direction: CrossChainDirection } & T;

export type SubmitFn = (value: CrossChainPayload) => Subscription;

export interface CrossChainComponentProps<T extends CrossChainParty> {
  form: FormInstance<CrossChainPayload<T>>;
  direction: CrossChainDirection;
  setSubmit: React.Dispatch<React.SetStateAction<SubmitFn>>;
}

/* ---------------------------------------------------Bridge elements--------------------------------------------------- */

export interface CrossChainDirection<F = ChainConfig, T = ChainConfig> {
  from: F;
  to: T;
}

export type NullableCrossChainDirection = NullableFields<CrossChainDirection, 'from' | 'to'>;

export interface CrossChainParty {
  recipient: string;
  sender: string;
}

/**
 * for native token, T = string;
 * for mapped token, T = Mapped Token;
 */
export interface CrossChainAsset<T = string> {
  amount: string;
  asset: T | null;
}

/* ---------------------------------------------------E2D--------------------------------------------------- */

export interface Ethereum2DarwiniaPayload extends CrossChainParty, CrossChainAsset {
  deposit?: Deposit;
}

/* ---------------------------------------------------D2E--------------------------------------------------- */

export enum DarwiniaAsset {
  ring = 'ring',
  kton = 'kton',
}

export interface Darwinia2EthereumPayload extends CrossChainParty {
  assets: (CrossChainAsset<DarwiniaAsset> & { checked?: boolean; unit?: Unit })[];
}

/* ---------------------------------------------------DVM--------------------------------------------------- */

export type DVMAsset = Erc20Token;

export interface DVMPayload extends CrossChainParty, CrossChainAsset<DVMAsset> {}

/* ---------------------------------------------------S2S--------------------------------------------------- */

export type SubstrateAsset = string | Erc20Token;

export interface Substrate2SubstrateDVMPayload extends CrossChainParty, CrossChainAsset<SubstrateAsset> {}
