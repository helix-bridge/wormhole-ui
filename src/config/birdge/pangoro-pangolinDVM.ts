import { SubstrateSubstrateDVMBridgeConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../network';

export const pangoroPangolinDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 27020,
  api: {
    dapp: 'https://api.darwinia.network.l2me.com',
    evolution: EVOLUTION_DOMAIN.dev,
    subGraph: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-pangoro',
  },
};
