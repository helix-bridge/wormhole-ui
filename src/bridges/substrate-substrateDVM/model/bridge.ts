import { BridgeConfig, ContractConfig, Api, ApiKeys } from '../../../model';

export type SubstrateSubstrateDVMBridgeConfig = Required<
  Omit<BridgeConfig<ContractConfig, Omit<Api<ApiKeys>, 'subscan' | 'subqlMMr'>>, 'contracts'>
>;
