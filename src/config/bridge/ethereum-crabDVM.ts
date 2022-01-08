import { EthereumCrabDVMConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../network';
import { Bridge } from './bridge';

const ethereumCrabDVMConfig: EthereumCrabDVMConfig = {
  specVersion: 1180,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    issuing: '',
    redeem: '',
  },
};

export const ethereumCrabDVM = new Bridge(
  { network: 'ethereum', mode: 'native' },
  { network: 'crab', mode: 'dvm' },
  ethereumCrabDVMConfig
);
