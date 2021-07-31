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

type TokenContract = { [key in Token]?: string };

type Api = { subql: string; evolution: string; [key: string]: string };

export interface NetConfig {
  facade: Facade;
  fullName: string;
  ethereumChain: AddEthereumChainParameter;
  rpc: string;
  ss58Prefix: SS58Prefix;
  tokenContract: TokenContract & { registryEth?: string; issuingDarwinia?: string; bankDarwinia?: string };
  api: Api;
  isTest: boolean;
  type: NetworkType[];
  name: Network;
}

export type NetworkConfig<T = NetConfig> = Config<Network, T>;

/**
 * pending: initial state, indicate that the connection never launched.
 */
export type ConnectStatus = 'pending' | 'connecting' | 'success' | 'fail' | 'disconnected';

export type NetworkFilter = (network: Required<NetConfig>) => boolean;
