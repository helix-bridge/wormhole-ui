import { Api, ApiKeys, Departure, E2DContractConfig, ContractConfig, LockEventsStorage } from './network';

export type Bridge = [Departure, Departure];

export interface BridgeConfig<C extends ContractConfig, K extends ApiKeys = ApiKeys> {
  specVersion: number;
  contracts: C;
  api: Partial<Api<K>>;
}

export type BridgesConfig = [Bridge, BridgeConfig<ContractConfig>][];

/**
 * ethereum -> darwinia
 */
export interface EthereumDarwiniaBridgeConfig
  extends BridgeConfig<E2DContractConfig, Extract<ApiKeys, 'dapp' | 'evolution'>> {
  lockEvents: LockEventsStorage[];
}

/**
 * substrate -> substrate dvm
 */
export type SubstrateSubstrateDVMBridgeConfig = BridgeConfig<ContractConfig, Exclude<ApiKeys, 'subscan' | 'subqlMMr'>>;
