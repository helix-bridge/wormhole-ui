import { Config } from './common';
import { AddEthereumChainParameter } from './metamask';

export type PolkadotTypeNetwork = 'pangolin' | 'crab' | 'darwinia' | 'pangoro';

type EthereumTypeNetwork = 'ethereum' | 'ropsten';

type TronTypeNetwork = 'tron';

export type Network = PolkadotTypeNetwork | EthereumTypeNetwork | TronTypeNetwork;

export type NetworkCategory = 'polkadot' | 'ethereum' | 'darwinia' | 'dvm' | 'tron';

export type NetworkMode = 'native' | 'dvm';

export type NetworkFilter = (network: ChainConfig) => boolean;

interface Facade {
  logo: string;
  logoMinor: string;
  logoWithText: string;
}

interface DVMTokenConfig {
  ring: string;
  kton: string;
  [key: string]: string;
}

interface Provider {
  rpc: string;
  etherscan: string;
}

export interface ChainConfig {
  facade: Facade;
  isTest: boolean;
  name: Network;
  provider: Provider;
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

export type PangolinConfig = DVMChainConfig;

export type CrabConfig = DVMChainConfig;

export type PangoroConfig = PolkadotChainConfig;

export type DarwiniaConfig = PolkadotChainConfig;

/* ----------------------------------------Ethereum network config-------------------------------------------------- */

export type EthereumConfig = EthereumChainConfig;

export type RopstenConfig = EthereumChainConfig;

/* ----------------------------------------Tron network config-------------------------------------------------- */

export type TronConfig = ChainConfig;

/* ----------------------------------------Network Theme config-------------------------------------------------- */

export type NetworkThemeConfig<T> = Config<Network, T>;
