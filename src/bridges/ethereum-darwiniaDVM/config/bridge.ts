import { Bridge } from '../../../model';
import { EVOLUTION_DOMAIN } from '../../../config/api';
import { ethereumConfig, crabConfig, ropstenConfig, pangolinConfig } from '../../../config/network';
import { EthereumDVMBridgeConfig } from '../model';

const ethereumCrabDVMConfig: EthereumDVMBridgeConfig = {
  specVersion: 1200,
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

const ropstenPangolinDVMConfig: EthereumDVMBridgeConfig = {
  specVersion: 27020,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    proof: '0x096dba4ef2fc920b80ae081a80d4d5ca485b407d88f37d5fd6a2c59e5a696691',
    redeem: '0xb2Bea2358d817dAE01B0FD0DC3aECB25910E65AA',
    issuing: '0x49262B932E439271d05634c32978294C7Ea15d0C',
  },
};

/**
 * ethereum <-> dvm testnet
 */
export const ropstenPangolinDVM = new Bridge(ropstenConfig, pangolinConfig, ropstenPangolinDVMConfig, {
  stable: false,
});
