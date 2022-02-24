import { omit } from 'lodash';
import { Bridge, SubstrateDVMBridgeConfig } from '../../model';
import { crabConfig } from '../network';

const crabCrabDVMConfig: SubstrateDVMBridgeConfig = {
  specVersion: 1180,
  api: {
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-',
  },
  contracts: {
    ring: '0x588abe3F7EE935137102C5e2B8042788935f4CB0',
    kton: '0x159933C635570D5042723359fbD1619dFe83D3f3',
  },
};

/**
 * smart app: crab
 */
export const crabCrabDVM = new Bridge<SubstrateDVMBridgeConfig>(omit(crabConfig, 'dvm'), crabConfig, crabCrabDVMConfig);
