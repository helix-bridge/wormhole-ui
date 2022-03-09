import { BridgeConfig, ContractConfig, Api, ApiKeys } from '../../../model';

export type SubstrateDVMBridgeConfig = Required<
  Omit<BridgeConfig<ContractConfig, Pick<Api<ApiKeys>, 'subql'>>, 'contracts'>
>;
