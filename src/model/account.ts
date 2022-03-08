import type ExtType from '@polkadot/extension-inject/types';
import BN from 'bn.js';
import { Units } from 'web3-utils';
import { WithOptional } from './type-operator';

export type InjectedAccountWithMeta = ExtType.InjectedAccountWithMeta;

export type IAccountMeta = WithOptional<InjectedAccountWithMeta, 'meta'>;

export interface Token<T = string> {
  symbol: T;
  decimal: keyof Units;
}

export interface PolkadotChain {
  tokens: Token[];
  ss58Format: string;
}

export interface AvailableBalance<T = string> {
  max: string | number | BN;
  asset: T;
  token: Token;
}

export interface DailyLimit {
  limit: string | number;
  spentToday: string | number;
}
