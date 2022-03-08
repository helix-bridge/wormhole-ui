import { Bridge, EthereumDVMBridgeConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../api';
import { ethereumConfig, crabConfig } from '../network';

const ethereumCrabDVMConfig: EthereumDVMBridgeConfig = {
  specVersion: 1180,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    issuing: '',
    redeem: '',
    proof: '',
  },
};

export const ethereumCrabDVM = new Bridge(ethereumConfig, crabConfig, ethereumCrabDVMConfig, {
  stable: false,
  status: 'pending',
});
