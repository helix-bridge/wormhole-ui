import { omit } from 'lodash';
import { Bridge, SubstrateDVMBridgeConfig } from '../../model';
import { pangolinConfig } from '../network';

const pangolinPangolinDVMConfig: SubstrateDVMBridgeConfig = {
  specVersion: 27020,
  api: {
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
  },
  contracts: {
    ring: '0xc52287b259b2431ba0f61BC7EBD0eD793B0b7044',
    kton: '0x8809f9b3ACEF1dA309f49b5Ab97A4C0faA64E6Ae',
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
