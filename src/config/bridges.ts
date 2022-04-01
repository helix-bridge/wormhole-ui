import { omit } from 'lodash';
import { ethereumDarwinia, ropstenPangolin } from '../bridges/ethereum-darwinia/config';
import { ethereumCrabDVM, ropstenPangolinDVM } from '../bridges/ethereum-darwiniaDVM/config';
import { crabCrabDVM, pangolinPangolinDVM } from '../bridges/substrate-dvm/config';
import { darwiniaCrabDVM, pangoroPangolinDVM } from '../bridges/substrate-substrateDVM/config';
import { Bridge, BridgeConfig } from '../model';
import { crabConfig, ethereumConfig, tronConfig } from './network';

export const BRIDGES = [
  crabCrabDVM,
  darwiniaCrabDVM,
  ethereumCrabDVM,
  ethereumDarwinia,
  pangolinPangolinDVM,
  pangoroPangolinDVM,
  ropstenPangolin,
  ropstenPangolinDVM,
];

const ethereumCrabConfig: BridgeConfig = {};

const tronCrabConfig: BridgeConfig = {};

const crabNative = omit(crabConfig, 'dvm');
const ethereumCrab = new Bridge(ethereumConfig, crabNative, ethereumCrabConfig);
const tronCrab = new Bridge(tronConfig, crabNative, tronCrabConfig);

export const AIRDROPS = [ethereumCrab, tronCrab];

export { darwiniaCrabDVM, pangoroPangolinDVM };
