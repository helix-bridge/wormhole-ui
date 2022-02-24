import { FunctionComponent } from 'react';
import {
  crabCrabDVM,
  darwiniaCrabDVM,
  ethereumCrabDVM,
  ethereumDarwinia,
  pangolinPangolinDVM,
  pangoroPangolinDVM,
  ropstenPangolin,
  ropstenPangolinDVM,
} from '../../config';
import { Darwinia2EthereumRecord, Ethereum2DarwiniaRecord } from '../record/ethereum-darwinia';
import { DVM2EthereumRecord, Ethereum2DVMRecord } from '../record/ethereum-dvm';
import { SubstrateDVMRecord } from '../record/substrate-dvm';
import { SubstrateSubstrateDVMRecord } from '../record/substrate-substrateDVM';
import { Darwinia2Ethereum } from './ethereum-darwinia/Darwinia2Ethereum';
import { Ethereum2Darwinia } from './ethereum-darwinia/Ethereum2Darwinia';
import { DarwiniaDVM2Ethereum } from './ethereum-dvm/DarwiniaDVM2Ethereum';
import { Ethereum2DarwiniaDVM } from './ethereum-dvm/Ethereum2DarwiniaDVM';
import { DVMSubstrate, SubstrateDVM } from './substrate-dvm';
import { Substrate2SubstrateDVM } from './substrate-substrateDVM/Substrate2SubstrateDVM';
import { SubstrateDVM2Substrate } from './substrate-substrateDVM/SubstrateDVM2Substrate';

/**
 * ethereum <-> darwinia
 * ropstent <-> pangolin
 */
ethereumDarwinia.setIssuingComponents(
  Ethereum2Darwinia as FunctionComponent,
  Ethereum2DarwiniaRecord as FunctionComponent
);
ethereumDarwinia.setRedeemComponents(
  Darwinia2Ethereum as FunctionComponent,
  Darwinia2EthereumRecord as FunctionComponent
);
ropstenPangolin.setIssuingComponents(
  Ethereum2Darwinia as FunctionComponent,
  Ethereum2DarwiniaRecord as FunctionComponent
);
ropstenPangolin.setRedeemComponents(
  Darwinia2Ethereum as FunctionComponent,
  Darwinia2EthereumRecord as FunctionComponent
);

/**
 * substrate <-> substrate dvm
 * darwinia <-> crab dvm
 * pangoro <-> pangolin dvm
 */
darwiniaCrabDVM.setIssuingComponents(
  Substrate2SubstrateDVM as FunctionComponent,
  SubstrateSubstrateDVMRecord as FunctionComponent
);
darwiniaCrabDVM.setRedeemComponents(
  SubstrateDVM2Substrate as FunctionComponent,
  SubstrateSubstrateDVMRecord as FunctionComponent
);
pangoroPangolinDVM.setIssuingComponents(
  Substrate2SubstrateDVM as FunctionComponent,
  SubstrateSubstrateDVMRecord as FunctionComponent
);
pangoroPangolinDVM.setRedeemComponents(
  SubstrateDVM2Substrate as FunctionComponent,
  SubstrateSubstrateDVMRecord as FunctionComponent
);

/**
 * substrate <-> dvm
 */
crabCrabDVM.setIssuingComponents(SubstrateDVM as FunctionComponent, SubstrateDVMRecord as FunctionComponent);
crabCrabDVM.setRedeemComponents(DVMSubstrate as FunctionComponent, SubstrateDVMRecord as FunctionComponent);
pangolinPangolinDVM.setIssuingComponents(SubstrateDVM as FunctionComponent, SubstrateDVMRecord as FunctionComponent);
pangolinPangolinDVM.setRedeemComponents(DVMSubstrate as FunctionComponent, SubstrateDVMRecord as FunctionComponent);

/**
 * ethereum <-> crab dvm
 * ropsten <-> pangolin dvm
 */
ethereumCrabDVM.setIssuingComponents(
  Ethereum2DarwiniaDVM as FunctionComponent,
  Ethereum2DVMRecord as FunctionComponent
);
ethereumCrabDVM.setRedeemComponents(DarwiniaDVM2Ethereum as FunctionComponent, DVM2EthereumRecord as FunctionComponent);
ropstenPangolinDVM.setIssuingComponents(
  Ethereum2DarwiniaDVM as FunctionComponent,
  Ethereum2DVMRecord as FunctionComponent
);
ropstenPangolinDVM.setRedeemComponents(
  DarwiniaDVM2Ethereum as FunctionComponent,
  DVM2EthereumRecord as FunctionComponent
);
