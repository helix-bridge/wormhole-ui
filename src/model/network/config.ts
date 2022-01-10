import { AddEthereumChainParameter } from '../metamask';
import { Facade } from './facade';
import { Network, NetworkCategory } from './network';

interface DVMTokenConfig {
  ring: string;
  kton: string;
  [key: string]: string;
}

interface ProviderConfig {
  rpc: string;
  etherscan: string;
}

export interface ChainConfig {
  facade: Facade;
  isTest: boolean;
  name: Network;
  provider: ProviderConfig;
  type: NetworkCategory[];
}

export interface EthereumChainConfig extends ChainConfig {
  ethereumChain: AddEthereumChainParameter;
}

export interface PolkadotChainConfig extends ChainConfig {
  ss58Prefix: number;
}

export interface DVMChainConfig extends EthereumChainConfig, PolkadotChainConfig {
  dvm: DVMTokenConfig;
}
