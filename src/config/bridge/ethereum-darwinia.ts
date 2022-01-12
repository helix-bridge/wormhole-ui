import { darwiniaConfig, ethereumConfig } from '../network';
import { Bridge, EthereumDarwiniaBridgeConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../api';

const ethereumDarwiniaConfig: EthereumDarwiniaBridgeConfig = {
  specVersion: 1180,
  api: { dapp: 'https://api.darwinia.network', evolution: EVOLUTION_DOMAIN.product },
  contracts: {
    fee: '0x6B0940772516B69088904564A56d09CFe6Bb3D85',
    issuing: '0xea7938985898af7fd945b03b7bc2e405e744e913',
    kton: '0x9f284e1337a815fe77d2ff4ae46544645b20c5ff',
    redeem: '0x5f44dd8e59f56aa04fe54e95cc690560ae706b18',
    redeemDeposit: '0x649fdf6ee483a96e020b889571e93700fbd82d88',
    ring: '0x9469d013805bffb7d3debe5e7839237e535ec483',
  },
  lockEvents: [
    {
      key: '0xf8860dda3d08046cf2706b92bf7202eaae7a79191c90e76297e0895605b8b457',
      max: 4344274,
      min: 0,
    },
    {
      key: '0x50ea63d9616704561328b9e0febe21cfae7a79191c90e76297e0895605b8b457',
      max: null,
      min: 4344275,
    },
  ],
};

/**
 * ethereum <-> darwinia
 */
export const ethereumDarwinia = new Bridge(ethereumConfig, darwiniaConfig, ethereumDarwiniaConfig);
