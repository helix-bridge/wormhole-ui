import { Bridge, SubstrateSubstrateDVMBridgeConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../api';
import { crabConfig, darwiniaConfig } from '../network';

const darwiniaCrabDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 1180,
  api: {
    dapp: 'https://api.darwinia.network',
    evolution: EVOLUTION_DOMAIN.product,
    subGraph: 'https://crab-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
    //     subqlMMr: 'https://api.subquery.network/sq/darwinia-network/darwinia-mmr',
  },
};

/**
 * substrate <-> substrate dvm
 */
export const darwiniaCrabDVM = new Bridge(darwiniaConfig, crabConfig, darwiniaCrabDVMConfig);
