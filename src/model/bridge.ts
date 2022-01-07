import { Api, ApiKeys, ContractConfig, E2DContractConfig, LockEventsStorage } from './network';

export interface BridgeConfig<C extends ContractConfig, K extends ApiKeys = ApiKeys> {
  specVersion: number;
  contracts?: C;
  api?: Partial<Api<K>>;
}

/**
 * ethereum <-> darwinia
 */
export interface EthereumDarwiniaBridgeConfig
  extends BridgeConfig<E2DContractConfig, Extract<ApiKeys, 'dapp' | 'evolution'>> {
  lockEvents: LockEventsStorage[];
}

/**
 * substrate <-> substrate dvm
 */
export type SubstrateSubstrateDVMBridgeConfig = BridgeConfig<ContractConfig, Exclude<ApiKeys, 'subscan' | 'subqlMMr'>>;

/**
 * ethereum <-> crab dvm
 */
export type EthereumCrabDVMConfig = BridgeConfig<ContractConfig>;
