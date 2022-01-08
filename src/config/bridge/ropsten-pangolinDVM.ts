import { EthereumCrabDVMConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../network';
import { Bridge } from './bridge';

const ropstenPangolinDVMConfig: EthereumCrabDVMConfig = {
  specVersion: 27020,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    issuing: '',
    redeem: '',
  },
};

export const ropstenPangolinDVM = new Bridge(
  { network: 'ropsten', mode: 'native' },
  { network: 'pangolin', mode: 'dvm' },
  ropstenPangolinDVMConfig
);
