import { EthereumCrabDVMConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../network';

export const ropstenPangolinDVMConfig: EthereumCrabDVMConfig = {
  specVersion: 27020,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    issuing: '',
    redeem: '',
  },
};
