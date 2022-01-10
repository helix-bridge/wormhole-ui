import { pangolinConfig, pangoroConfig } from '..';
import { Bridge, SubstrateSubstrateDVMBridgeConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../api';

const pangoroPangolinDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 27020,
  api: {
    dapp: 'https://api.darwinia.network.l2me.com',
    evolution: EVOLUTION_DOMAIN.dev,
    subGraph: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
  },
};

/**
 * substrate <-> substrate dvm testnet
 */
export const pangoroPangolinDVM = new Bridge(pangoroConfig, pangolinConfig, pangoroPangolinDVMConfig);
