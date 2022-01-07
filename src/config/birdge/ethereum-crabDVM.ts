import { EthereumCrabDVMConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../network';

export const ethereumCrabDVMConfig: EthereumCrabDVMConfig = {
  specVersion: 1180,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    issuing: '',
    redeem: '',
  },
};
