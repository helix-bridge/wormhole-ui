import type ExtType from '@polkadot/extension-inject/types';
import { WithOptional } from './common';

export type AccountType = 'polkadot' | 'ethereum';

export type InjectedAccountWithMeta = ExtType.InjectedAccountWithMeta;

export type IAccountMeta = WithOptional<InjectedAccountWithMeta, 'meta'>;
