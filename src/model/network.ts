import { ApiPromise } from '@polkadot/api';
import { IAccountMeta } from './account';
import { Config } from './common';
import { AddEthereumChainParameter } from './metamask';

export type PolkadotTypeNetwork = 'pangolin' | 'crab' | 'darwinia';

export type EthereumTypeNetwork = 'ethereum' | 'ropsten' | 'tron';

export type Network = PolkadotTypeNetwork | EthereumTypeNetwork;

export type NetworkCategory = 'polkadot' | 'ethereum' | 'tron' | 'darwinia';

export type Token = 'ring' | 'kton' | 'native' | 'erc20';

// eslint-disable-next-line no-magic-numbers
export type SS58Prefix = 0 | 2 | 18 | 42 | null;

interface Facade {
  logo: string;
  logoWithText: string;
}

type TokenContract = { [key in Token]?: string };

type Api = { subql: string; evolution: string; dapp: string; subscan: string; [key: string]: string };

export interface LockEventsStorage {
  min: number;
  max: number | null;
  key: string;
}

export interface Erc20TokenConfig {
  proofAddress: string;
  bankingAddress: string;
  mappingAddress: string;
}

export interface Provider {
  rpc: string;
  etherscan: string;
}

export interface NetConfig {
  api: Api;
  erc20Token: Erc20TokenConfig;
  ethereumChain: AddEthereumChainParameter;
  facade: Facade;
  fullName: string;
  isTest: boolean;
  lockEvents?: LockEventsStorage[];
  name: Network;
  provider: Provider;
  rpc: string;
  ss58Prefix: SS58Prefix;
  tokenContract: TokenContract & {
    registryEth?: string;
    issuingDarwinia?: string;
    issuingEthereum?: string;
    bankDarwinia?: string;
  };
  type: NetworkCategory[];
}

export type NetworkConfig<T = NetConfig> = Config<Network, T>;

/**
 * pending: initial state, indicate that the connection never launched.
 */
export type ConnectStatus = 'pending' | 'connecting' | 'success' | 'fail' | 'disconnected' | 'error';

export type Connection<T = Network> = T extends PolkadotTypeNetwork
  ? { status: ConnectStatus; api: ApiPromise | null; accounts: IAccountMeta[] }
  : { status: ConnectStatus; accounts: IAccountMeta[] };

export type PolkadotConnection = Connection<PolkadotTypeNetwork>;

export type EthereumConnection = Connection<EthereumTypeNetwork>;

export type NetworkFilter = (network: NetConfig) => boolean;
