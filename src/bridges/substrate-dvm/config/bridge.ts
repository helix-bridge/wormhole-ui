import { omit } from 'lodash';
import { pangolinConfig } from '../../../config/network';
import { Bridge } from '../../../model';
import { crabConfig } from '../../../config/network';
import { SubstrateDVMBridgeConfig } from '../model';

const crabCrabDVMConfig: SubstrateDVMBridgeConfig = {
  api: {
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
  },
};

/**
 * smart app: crab
 */
export const crabCrabDVM = new Bridge<SubstrateDVMBridgeConfig>(
  omit(crabConfig, 'dvm'),
  crabConfig,
  crabCrabDVMConfig,
  { category: 'helix', activeAssistantConnection: true, stable: false }
);

const pangolinPangolinDVMConfig: SubstrateDVMBridgeConfig = {
  api: {
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
  },
};

/**
 * smart app: testnet
 */
export const pangolinPangolinDVM = new Bridge<SubstrateDVMBridgeConfig>(
  omit(pangolinConfig, 'dvm'),
  pangolinConfig,
  pangolinPangolinDVMConfig,
  { category: 'helix', activeAssistantConnection: true, stable: false }
);
