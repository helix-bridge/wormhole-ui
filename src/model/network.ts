import { Config } from './common';
import { AddEthereumChainParameter } from './metamask';

export type Network = 'pangolin' | 'crab' | 'darwinia' | 'ethereum' | 'ropsten' | 'tron';

export type NetworkType = 'polkadot' | 'ethereum' | 'tron' | 'darwinia';

export type Token = 'ring' | 'kton' | 'native';

// eslint-disable-next-line no-magic-numbers
export type SS58Prefix = 0 | 2 | 18 | 42 | null;

interface Facade {
  logo: string;
  logoWithText: string;
}

type TokenRecord = { [key in Token]?: string };

type Api = { subql: string; [key: string]: string };

export interface NetConfig {
  facade: Facade;
  fullName: string;
  ethereumChain: AddEthereumChainParameter;
  rpc: string;
  ss58Prefix: SS58Prefix;
  token: TokenRecord;
  api: Api;
  isTest: boolean;
  type: NetworkType[];
  name: Network;
}

export type NetworkConfig<T = NetConfig> = Config<Network, T>;

export type TxStatus =
  | 'future'
  | 'ready'
  | 'finalized'
  | 'finalitytimeout'
  | 'usurped'
  | 'dropped'
  | 'inblock'
  | 'invalid'
  | 'broadcast'
  | 'cancelled'
  | 'completed'
  | 'error'
  | 'incomplete'
  | 'queued'
  | 'qr'
  | 'retracted'
  | 'sending'
  | 'signing'
  | 'sent'
  | 'blocked';

/**
 * pending: initial state, indicate that the connection never launched.
 */
export type ConnectStatus = 'pending' | 'connecting' | 'success' | 'fail' | 'disconnected';

export type NetworkFilter = (network: Required<NetConfig>) => boolean;
