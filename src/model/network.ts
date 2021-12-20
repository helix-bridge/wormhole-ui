import { ApiPromise } from '@polkadot/api';
import { IAccountMeta } from './account';
import { Config } from './common';
import { AddEthereumChainParameter } from './metamask';

export type PolkadotTypeNetwork = 'pangolin' | 'crab' | 'darwinia' | 'pangoro';

type EthereumTypeNetwork = 'ethereum' | 'ropsten';

type TronTypeNetwork = 'tron';

export type Network = PolkadotTypeNetwork | EthereumTypeNetwork | TronTypeNetwork;

export type NetworkCategory = 'polkadot' | 'ethereum' | 'darwinia' | 'dvm' | 'tron';

// eslint-disable-next-line no-magic-numbers
export type SS58Prefix = 0 | 2 | 18 | 42 | null;

interface Facade {
  logo: string;
  logoMinor: string;
  logoWithText: string;
}

/**
 * TODO: remove centralized API:
 * dapp: e2d records; erc20 register proof querying
 * evolution: deposit records
 * subscan: airdrop records in crab
 */
export type ApiKeys = 'subql' | 'subqlMMr' | 'evolution' | 'dapp' | 'subscan' | 'subGraph';

export type Api<T extends ApiKeys> = { [key in T]: string };

export interface LockEventsStorage {
  min: number;
  max: number | null;
  key: string;
}

interface DVMTokenConfig {
  ring: string;
  kton: string;
}

interface Provider {
  rpc: string;
  etherscan: string;
}

interface ContractConfig {
  issuing: string;
  redeem: string;
}

interface E2DContractConfig extends ContractConfig {
  ring: string; // e2d ring balance address
  kton: string; // e2d kton balance address
  fee: string; // e2d cross chain fee querying address
  redeemDeposit: string; // e2d redeem deposit address
}

interface E2DVMContractConfig extends ContractConfig {
  proof: string;
}

export interface EthereumChainConfig {
  ethereumChain: AddEthereumChainParameter;
}

export interface EthereumChainDVMConfig<T extends ApiKeys = ApiKeys> extends EthereumChainConfig, ChainConfig<T> {
  dvm: DVMTokenConfig;
}

export interface ChainConfig<A extends ApiKeys = never> {
  api: Api<A>;
  facade: Facade;
  isTest: boolean;
  name: Network;
  provider: Provider;
  type: NetworkCategory[];
}

/* ----------------------------------------Polkadot network config-------------------------------------------------- */

export interface PolkadotConfig<T extends ApiKeys> extends ChainConfig<T> {
  ss58Prefix: SS58Prefix;
}

export interface PangolinConfig
  extends PolkadotConfig<Exclude<ApiKeys, 'subscan'>>,
    EthereumChainDVMConfig<Exclude<ApiKeys, 'subscan'>> {
  contracts: {
    e2d: E2DContractConfig;
    e2dvm: E2DVMContractConfig;
  };
  lockEvents: LockEventsStorage[];
}

export type PangoroConfig = PolkadotConfig<Exclude<ApiKeys, 'subscan' | 'subqlMMr'>>;

export interface CrabConfig
  extends PolkadotConfig<Exclude<ApiKeys, 'subqlMMr'>>,
    EthereumChainDVMConfig<Exclude<ApiKeys, 'subqlMMr'>> {
  contracts: {
    e2dvm: E2DVMContractConfig;
  };
}

export interface DarwiniaConfig extends PolkadotConfig<Exclude<ApiKeys, 'subscan'>> {
  contracts: {
    e2d: E2DContractConfig;
  };
  lockEvents: LockEventsStorage[];
}

/* ----------------------------------------Ethereum network config-------------------------------------------------- */

export interface EthereumConfig extends ChainConfig<Extract<ApiKeys, 'dapp' | 'evolution'>>, EthereumChainConfig {
  contracts: {
    e2d: E2DContractConfig;
    e2dvm: E2DVMContractConfig;
  };
}

export type RopstenConfig = EthereumConfig;

/* ----------------------------------------Tron network config-------------------------------------------------- */

type TronConfig = ChainConfig<Extract<ApiKeys, 'dapp'>>;

type NetworkMetaConfig<T extends Network, C extends ChainConfig<never>> = Config<T, C>;

export type NetworkConfig = NetworkMetaConfig<'pangolin', PangolinConfig> &
  NetworkMetaConfig<'pangoro', PangoroConfig> &
  NetworkMetaConfig<'crab', CrabConfig> &
  NetworkMetaConfig<'darwinia', DarwiniaConfig> &
  NetworkMetaConfig<'ethereum', EthereumConfig> &
  NetworkMetaConfig<'ropsten', RopstenConfig> &
  NetworkMetaConfig<'tron', TronConfig>;

/* ----------------------------------------Network Theme config-------------------------------------------------- */

export type NetworkThemeConfig<T> = Config<Network, T>;

/* ----------------------------------------Connection config-------------------------------------------------- */

/**
 * pending: initial state, indicate that the connection never launched.
 */
export enum ConnectionStatus {
  pending = 'pending',
  connecting = 'connecting',
  success = 'success',
  fail = 'fail',
  disconnected = 'disconnected',
  error = 'error',
}
export type ConnectionType = 'polkadot' | 'metamask' | 'tron' | 'unknown';

export interface Connection {
  status: ConnectionStatus;
  accounts: IAccountMeta[];
  type: ConnectionType;
  [key: string]: unknown;
}

export interface PolkadotConnection extends Connection {
  api: ApiPromise | null;
}

export interface EthereumConnection extends Connection {
  chainId: string;
}

export type TronConnection = Connection;

export type NetworkFilter = (network: ChainConfig<never>) => boolean;

export type NetworkMode = 'native' | 'dvm';

export interface Vertices {
  network: Network;
  mode: NetworkMode;
}

export type Departure = Vertices;

export interface Arrival extends Vertices {
  status: 'pending' | 'available';
  stable?: boolean;
}
