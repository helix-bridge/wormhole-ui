import { Bridge, EthereumCrabDVMConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../evolution';

const ropstenPangolinDVMConfig: EthereumCrabDVMConfig = {
  specVersion: 27020,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    issuing: '',
    redeem: '',
  },
};

/**
 * ethereum <-> dvm testnet
 */
export const ropstenPangolinDVM = new Bridge(
  { network: 'ropsten', mode: 'native' },
  { network: 'pangolin', mode: 'dvm' },
  ropstenPangolinDVMConfig,
  { stable: false }
);
