import { crabConfig, darwiniaConfig, pangolinConfig, pangoroConfig } from '../../../config/network';
import { EVOLUTION_DOMAIN } from '../../../config/api';
import { Bridge } from '../../../model';
import { SubstrateSubstrateDVMBridgeConfig } from '../model/bridge';

const darwiniaCrabDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 1200,
  api: {
    dapp: 'https://api.darwinia.network',
    evolution: EVOLUTION_DOMAIN.product,
    subGraph: 'https://crab-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
    //     subqlMMr: 'https://api.subquery.network/sq/darwinia-network/darwinia-mmr',
  },
};

export const darwiniaCrabDVM = new Bridge(darwiniaConfig, crabConfig, darwiniaCrabDVMConfig, {
  activeAssistantConnection: true,
});

const pangoroPangolinDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 27020,
  api: {
    dapp: 'https://api.darwinia.network.l2me.com',
    evolution: EVOLUTION_DOMAIN.dev,
    subGraph: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
  },
};

export const pangoroPangolinDVM = new Bridge(pangoroConfig, pangolinConfig, pangoroPangolinDVMConfig, {
  activeAssistantConnection: true,
});
