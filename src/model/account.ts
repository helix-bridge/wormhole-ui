import type ExtType from '@polkadot/extension-inject/types';
import { Units } from 'web3-utils';
import BN from 'bn.js';
import { WithOptional } from './common';

export type InjectedAccountWithMeta = ExtType.InjectedAccountWithMeta;

export type IAccountMeta = WithOptional<InjectedAccountWithMeta, 'meta'>;

export interface TokenChainInfo {
  symbol: string;
  decimal: keyof Units;
}

export interface Chain {
  tokens: TokenChainInfo[];
  ss58Format: string;
}
export interface AvailableBalance<T = string> {
  max: string | number | BN;
  asset: T;
  chainInfo?: TokenChainInfo;
}
