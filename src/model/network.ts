import { ApiPromise } from '@polkadot/api';
import { IAccountMeta } from './account';
import { Config } from './common';
import { AddEthereumChainParameter } from './metamask';

export type PolkadotTypeNetwork = 'pangolin' | 'crab' | 'darwinia';

export type EthereumTypeNetwork = 'ethereum' | 'ropsten';

export type Network = PolkadotTypeNetwork | EthereumTypeNetwork;

export type NetworkCategory = 'polkadot' | 'ethereum' | 'darwinia' | 'dvm';

export type Token = 'ring' | 'kton' | 'native';

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

export interface DVMConfig {
  ring: string;
  kton: string;
}

export interface Provider {
  rpc: string;
  etherscan: string;
}

export interface NetConfig {
  api: Api;
  dvm?: DVMConfig;
  erc20Token: Erc20TokenConfig;
  ethereumChain: AddEthereumChainParameter;
  facade: Facade;
  fullName: string;
  isTest: boolean;
  lockEvents?: LockEventsStorage[];
  name: Network;
  provider: Provider;
  ss58Prefix: SS58Prefix;
  tokenContract: TokenContract & {
    registryEth?: string;
    issuingDarwinia?: string;
    issuingEthereum?: string;
    bankDarwinia?: string;
  };
  type: NetworkCategory[];
}

export type NetworkConfig<T = NetConfig> = Config<PolkadotTypeNetwork, T> & Config<EthereumTypeNetwork, Omit<T, 'dvm'>>;

/**
 * pending: initial state, indicate that the connection never launched.
 */
export type ConnectionStatus = 'pending' | 'connecting' | 'success' | 'fail' | 'disconnected' | 'error';
export type ConnectionType = 'polkadot' | 'metamask' | 'unknown';

export type Connection<T = Network> = T extends PolkadotTypeNetwork
  ? {
      status: ConnectionStatus;
      accounts: IAccountMeta[];
      type: ConnectionType;
      api: ApiPromise | null;
    }
  : { status: ConnectionStatus; accounts: IAccountMeta[]; type: ConnectionType; chainId: string };

export type PolkadotConnection = Connection<PolkadotTypeNetwork>;

export type EthereumConnection = Connection<EthereumTypeNetwork>;

export type NetworkFilter = (network: NetConfig) => boolean;

export type NetworkMode = 'native' | 'dvm';

export interface Vertices {
  network: Network;
  mode: NetworkMode;
}

export type Departure = Vertices;

export interface Arrival extends Vertices {
  status: 'pending' | 'available';
}
