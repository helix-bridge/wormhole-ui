import { omit } from 'lodash';
import { Bridge, SubstrateDVMBridgeConfig } from '../../model';
import { pangolinConfig } from '../network';

const pangolinPangolinDVMConfig: SubstrateDVMBridgeConfig = {
  specVersion: 27020,
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
  pangolinPangolinDVMConfig
);
