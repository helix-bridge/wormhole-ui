import { omit } from 'lodash';
import { Bridge, SubstrateDVMBridgeConfig } from '../../model';
import { crabConfig } from '../network';

const crabCrabDVMConfig: SubstrateDVMBridgeConfig = {
  specVersion: 1180,
  api: {
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
  },
};

/**
 * smart app: crab
 */
export const crabCrabDVM = new Bridge<SubstrateDVMBridgeConfig>(omit(crabConfig, 'dvm'), crabConfig, crabCrabDVMConfig);
