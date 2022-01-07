import { EVOLUTION_DOMAIN } from '../network';
import { SubstrateSubstrateDVMBridgeConfig } from '../../model';

export const darwiniaCrabDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 1180,
  api: {
    dapp: 'https://api.darwinia.network',
    evolution: EVOLUTION_DOMAIN.product,
    subGraph: 'https://crab-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-darwinia',
    //     subqlMMr: 'https://api.subquery.network/sq/darwinia-network/darwinia-mmr',
  },
};
