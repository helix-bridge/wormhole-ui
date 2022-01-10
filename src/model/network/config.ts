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

/* ----------------------------------------Polkadot network config-------------------------------------------------- */

export type CrabConfig = DVMChainConfig;

export type PangoroConfig = PolkadotChainConfig;

export type DarwiniaConfig = PolkadotChainConfig;

/* ----------------------------------------Ethereum network config-------------------------------------------------- */

export type EthereumConfig = EthereumChainConfig;

export type RopstenConfig = EthereumChainConfig;

/* ----------------------------------------Tron network config-------------------------------------------------- */

export type TronConfig = ChainConfig;
