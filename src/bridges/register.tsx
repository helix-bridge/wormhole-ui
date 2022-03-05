import { FunctionComponent } from 'react';
import { Darwinia2EthereumRecord, Ethereum2DarwiniaRecord } from '../components/record/ethereum-darwinia';
import { DVM2EthereumRecord, Ethereum2DVMRecord } from '../components/record/ethereum-dvm';
import { SubstrateDVMRecord } from '../components/record/substrate-dvm';
import { SubstrateSubstrateDVMRecord } from '../components/record/substrate-substrateDVM';
import {
  crabCrabDVM,
  darwiniaCrabDVM,
  ethereumCrabDVM,
  ethereumDarwinia,
  pangolinPangolinDVM,
  pangoroPangolinDVM,
  ropstenPangolin,
  ropstenPangolinDVM,
} from '../config';
import { Darwinia2Ethereum, Ethereum2Darwinia } from './ethereum-darwinia';
import { DarwiniaDVM2Ethereum, Ethereum2DarwiniaDVM } from './ethereum-darwiniaDVM';
import { DVM2Substrate, Substrate2DVM } from './substrate-dvm';
import { Substrate2SubstrateDVM, SubstrateDVM2Substrate } from './substrate-substrateDVM';

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
 * crab <-> crab dvm
 * pangolin <-> pangolin dvm
 */
crabCrabDVM.setIssuingComponents(Substrate2DVM as FunctionComponent, SubstrateDVMRecord as FunctionComponent);
crabCrabDVM.setRedeemComponents(DVM2Substrate as FunctionComponent, SubstrateDVMRecord as FunctionComponent);
pangolinPangolinDVM.setIssuingComponents(Substrate2DVM as FunctionComponent, SubstrateDVMRecord as FunctionComponent);
pangolinPangolinDVM.setRedeemComponents(DVM2Substrate as FunctionComponent, SubstrateDVMRecord as FunctionComponent);

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
