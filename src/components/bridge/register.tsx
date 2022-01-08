import { FunctionComponent } from 'react';
import {
  darwiniaCrabDVM,
  ethereumCrabDVM,
  ethereumDarwinia,
  pangoroPangolinDVM,
  ropstenPangolin,
  ropstenPangolinDVM,
} from '../../config';
import { D2ERecord } from '../records/D2ERecord';
import { E2DRecord } from '../records/E2DRecord';
import { S2SRecord } from '../records/S2SRecord';
import { Darwinia2Ethereum } from './ethereum-darwinia/Darwinia2Ethereum';
import { Ethereum2Darwinia } from './ethereum-darwinia/Ethereum2Darwinia';
import { DarwiniaDVM2Ethereum } from './ethereum-dvm/DarwiniaDVM2Ethereum';
import { Ethereum2DarwiniaDVM } from './ethereum-dvm/Ethereum2DarwiniaDVM';
import { Substrate2SubstrateDVM } from './substrate-substrateDVM/Substrate2SubstrateDVM';
import { SubstrateDVM2Substrate } from './substrate-substrateDVM/SubstrateDVM2Substrate';

/* ------------------------------------- register bridge components ---------------------------------------- */

/**
 * ethereum <-> darwinia
 */
ethereumDarwinia.setIssuingComponents(Ethereum2Darwinia as FunctionComponent, E2DRecord as FunctionComponent);
ethereumDarwinia.setRedeemComponents(Darwinia2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);
ropstenPangolin.setIssuingComponents(Ethereum2Darwinia as FunctionComponent, E2DRecord as FunctionComponent);
ropstenPangolin.setRedeemComponents(Darwinia2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);

/**
 * substrate <-> substrate dvm
 */
darwiniaCrabDVM.setIssuingComponents(Substrate2SubstrateDVM as FunctionComponent, S2SRecord as FunctionComponent);
darwiniaCrabDVM.setRedeemComponents(SubstrateDVM2Substrate as FunctionComponent, S2SRecord as FunctionComponent);
pangoroPangolinDVM.setIssuingComponents(Substrate2SubstrateDVM as FunctionComponent, S2SRecord as FunctionComponent);
pangoroPangolinDVM.setRedeemComponents(SubstrateDVM2Substrate as FunctionComponent, S2SRecord as FunctionComponent);

/**
 * ethereum <-> crab dvm
 */
ethereumCrabDVM.setIssuingComponents(Ethereum2DarwiniaDVM as FunctionComponent, E2DRecord as FunctionComponent);
ethereumCrabDVM.setRedeemComponents(DarwiniaDVM2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);
ropstenPangolinDVM.setIssuingComponents(Ethereum2DarwiniaDVM as FunctionComponent, E2DRecord as FunctionComponent);
ropstenPangolinDVM.setRedeemComponents(DarwiniaDVM2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);
