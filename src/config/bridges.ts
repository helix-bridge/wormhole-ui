import { ethereumDarwinia, ropstenPangolin } from '../bridges/ethereum-darwinia/config';
import { ethereumCrabDVM, ropstenPangolinDVM } from '../bridges/ethereum-darwiniaDVM/config';
import { crabCrabDVM, pangolinPangolinDVM } from '../bridges/substrate-dvm/config';
import { darwiniaCrabDVM, pangoroPangolinDVM } from '../bridges/substrate-substrateDVM/config';

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
