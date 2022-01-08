import { EVOLUTION_DOMAIN } from '../network';
import { EthereumConfig } from '../../model';

export const ethereumConfig: EthereumConfig = {
  api: {
    dapp: 'https://api.darwinia.network',
    evolution: EVOLUTION_DOMAIN.product,
  },
  contracts: {
    e2d: {
      fee: '0x6B0940772516B69088904564A56d09CFe6Bb3D85',
      issuing: '0xea7938985898af7fd945b03b7bc2e405e744e913',
      kton: '0x9f284e1337a815fe77d2ff4ae46544645b20c5ff',
      redeem: '0x5f44dd8e59f56aa04fe54e95cc690560ae706b18',
      redeemDeposit: '0x649fdf6ee483a96e020b889571e93700fbd82d88',
      ring: '0x9469d013805bffb7d3debe5e7839237e535ec483',
    },
    // unimplemented
    e2dvm: {
      proof: '',
      redeem: '',
      issuing: '',
    },
  },
  ethereumChain: {
    chainId: '1',
    chainName: '',
    nativeCurrency: {
      decimals: 18,
    },
    rpcUrls: [],
  },
  facade: {
    logo: '/image/eth-logo.svg',
    logoMinor: '/image/ethereum.svg',
    logoWithText: '',
  },
  isTest: false,
  name: 'ethereum',
  provider: {
    etherscan: 'wss://mainnet.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
    rpc: '',
  },
  type: ['ethereum'],
};
