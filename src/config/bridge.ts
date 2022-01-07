import { BridgesConfig, EthereumDarwiniaBridgeConfig, SubstrateSubstrateDVMBridgeConfig } from '../model';
import { EVOLUTION_DOMAIN } from './network';

const ethereumDarwiniaBridgeConfig: EthereumDarwiniaBridgeConfig = {
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

const ropstenPangolinBridgeConfig: EthereumDarwiniaBridgeConfig = {
  specVersion: 27020,
  api: {
    dapp: 'https://api.darwinia.network.l2me.com',
    evolution: EVOLUTION_DOMAIN.dev,
  },
  contracts: {
    fee: '0x6982702995b053A21389219c1BFc0b188eB5a372',
    issuing: '0x49262B932E439271d05634c32978294C7Ea15d0C',
    kton: '0x1994100c58753793D52c6f457f189aa3ce9cEe94',
    redeem: '0x98fAE9274562FE131e2CF5771ebFB0bB232aFd25',
    redeemDeposit: '0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e',
    ring: '0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0',
  },
  lockEvents: [
    {
      key: '0x50ea63d9616704561328b9e0febe21cfae7a79191c90e76297e0895605b8b457',
      max: null,
      min: 0,
    },
  ],
};

const darwiniaCrabDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 1180,
  api: {
    dapp: 'https://api.darwinia.network',
    evolution: EVOLUTION_DOMAIN.product,
    subGraph: 'https://crab-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-darwinia',
    //     subqlMMr: 'https://api.subquery.network/sq/darwinia-network/darwinia-mmr',
  },
  contracts: { issuing: '', redeem: '' },
};

const pangoroPangolinDVMConfig: SubstrateSubstrateDVMBridgeConfig = {
  specVersion: 27020,
  api: {
    dapp: 'https://api.darwinia.network.l2me.com',
    evolution: EVOLUTION_DOMAIN.dev,
    subGraph: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-pangoro',
  },
  contracts: { issuing: '', redeem: '' },
};

export const BRIDGES_CONFIG: BridgesConfig = [
  [
    [
      { network: 'ethereum', mode: 'native' },
      { network: 'darwinia', mode: 'native' },
    ],
    ethereumDarwiniaBridgeConfig,
  ],
  [
    [
      { network: 'ropsten', mode: 'native' },
      { network: 'pangolin', mode: 'native' },
    ],
    ropstenPangolinBridgeConfig,
  ],
  [
    [
      { network: 'darwinia', mode: 'native' },
      { network: 'crab', mode: 'dvm' },
    ],
    darwiniaCrabDVMConfig,
  ],
  [
    [
      { network: 'pangoro', mode: 'native' },
      { network: 'pangolin', mode: 'dvm' },
    ],
    pangoroPangolinDVMConfig,
  ],
];
