import { chain, omit } from 'lodash';
import { Arrival, Departure, NetConfig, NetworkConfig } from '../model';

const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

export enum Graph {
  crab = 'crab',
  darwinia = 'darwinia',
  ethereum = 'ethereum',
  pangolin = 'pangolin',
  ropsten = 'ropsten',
  tron = 'tron',
}

// eslint-disable-next-line no-magic-numbers
const allowAlias: (full: string, at?: number) => string[] = (fullName, startAt = 3) => {
  const len = fullName.length;
  const shortestName = fullName.substr(0, startAt);

  return new Array(len - startAt).fill('').map((_, index) => shortestName + fullName.substr(startAt, index));
};

export const NETWORK_ALIAS = new Map([[Graph.ethereum, [...allowAlias(Graph.ethereum)]]]);

const EVOLUTION_DOMAIN = {
  product: 'https://www.evolution.land',
  dev: 'https://www.evolution.land.l2me.com',
};

/**
 * TODO：need to implement some helper function to set the common configuration
 * example: api.dapp, api.evolution just depends on whether the chain is a test chain.
 */
export const NETWORK_CONFIG: NetworkConfig = {
  crab: {
    api: {
      subql: 'https://api.subquery.network/sq/darwinia-network/crab',
      evolution: EVOLUTION_DOMAIN.product,
      dapp: 'https://api.darwinia.network',
      subscan: 'https://crab.subscan.io',
    },
    dvm: {
      ring: '0x588abe3F7EE935137102C5e2B8042788935f4CB0',
      kton: '0xbfE9E136270cE46A2A6a8E8D54718BdAEBEbaA3D',
    },
    erc20Token: {
      proofAddress: '',
      bankingAddress: '', // erc20 banking address
      mappingAddress: '',
    },
    ethereumChain: {
      chainId: '44',
      chainName: '',
      nativeCurrency: {
        decimals: 18,
      },
      rpcUrls: ['https://crab-rpc.darwinia.network/'],
      blockExplorerUrls: ['https://crab.subscan.io/'],
    },
    facade: {
      logo: '/image/crab-button-mobile.png',
      logoWithText: '/image/crab-logo.svg',
    },
    fullName: 'Darwinia Crab',
    isTest: false,
    name: 'crab',
    provider: {
      rpc: 'wss://crab-rpc.darwinia.network',
      etherscan: '',
    },
    ss58Prefix: 42,
    tokenContract: {
      native: 'CRING',
    },
    type: ['polkadot', 'darwinia'],
  },
  darwinia: {
    api: {
      subql: 'https://api.subquery.network/sq/darwinia-network/darwinia',
      evolution: EVOLUTION_DOMAIN.product,
      dapp: 'https://api.darwinia.network',
      subscan: '',
    },
    dvm: {
      ring: '',
      kton: '',
    },
    erc20Token: {
      bankingAddress: '',
      mappingAddress: '',
      proofAddress: '',
    },
    ethereumChain: {
      chainId: '',
      chainName: '',
      nativeCurrency: {
        decimals: 18,
      },
      rpcUrls: [],
    },
    facade: {
      logo: '/image/darwinia-button-mobile.png',
      logoWithText: '/image/darwinia-logo.svg',
    },
    fullName: 'Darwinia',
    isTest: false,
    lockEvents: [
      {
        min: 0,
        max: 4344274,
        key: '0xf8860dda3d08046cf2706b92bf7202eaae7a79191c90e76297e0895605b8b457',
      },
      {
        min: 4344275,
        max: null,
        key: '0x50ea63d9616704561328b9e0febe21cfae7a79191c90e76297e0895605b8b457',
      },
    ],
    name: 'darwinia',
    provider: {
      rpc: 'wss://rpc.darwinia.network',
      etherscan: '',
    },
    ss58Prefix: 18,
    tokenContract: {
      native: 'RING',
      issuingDarwinia: '0xea7938985898af7fd945b03b7bc2e405e744e913',
      bankEthereum: '0x5f44dd8e59f56aa04fe54e95cc690560ae706b18',
      bankDarwinia: '0x649fdf6ee483a96e020b889571e93700fbd82d88',
    },
    type: ['polkadot', 'darwinia'],
  },
  ethereum: {
    api: {
      subql: '',
      evolution: EVOLUTION_DOMAIN.product,
      dapp: 'https://api.darwinia.network',
      subscan: '',
    },
    erc20Token: {
      bankingAddress: '',
      mappingAddress: '',
      proofAddress: '',
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
      logo: 'image/eth-logo.svg',
      logoWithText: '',
    },
    fullName: 'Ethereum',
    isTest: false,
    name: 'ethereum',
    provider: {
      rpc: '',
      etherscan: 'wss://mainnet.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
    },
    ss58Prefix: 18,
    tokenContract: {
      native: 'eth',
      ring: '0x9469d013805bffb7d3debe5e7839237e535ec483',
      kton: '0x9f284e1337a815fe77d2ff4ae46544645b20c5ff',
      registryEth: '0x6B0940772516B69088904564A56d09CFe6Bb3D85',
      issuingDarwinia: '0xea7938985898af7fd945b03b7bc2e405e744e913',
      bankEthereum: '0x5f44dd8e59f56aa04fe54e95cc690560ae706b18',
      bankDarwinia: '0x649fdf6ee483a96e020b889571e93700fbd82d88',
    },
    type: ['ethereum'],
  },
  pangolin: {
    api: {
      subql: 'https://api.subquery.network/sq/darwinia-network/pangolin',
      evolution: EVOLUTION_DOMAIN.dev,
      dapp: 'https://api.darwinia.network.l2me.com',
      subscan: '',
    },
    dvm: {
      ring: '0xbBD91aD844557ADCbb97296216b3B3c977FCC4F2',
      kton: '0xc8C1680B18D432732D07c044669915726fAF67D0',
    },
    erc20Token: {
      bankingAddress: '0xb2Bea2358d817dAE01B0FD0DC3aECB25910E65AA',
      mappingAddress: '0xcB8531Bc0B7C8F41B55CF4E94698C37b130597B9',
      proofAddress: '0x096dba4ef2fc920b80ae081a80d4d5ca485b407d88f37d5fd6a2c59e5a696691',
    },
    ethereumChain: {
      chainId: '43',
      chainName: '',
      nativeCurrency: {
        decimals: 18,
      },
      rpcUrls: ['https://pangolin-rpc.darwinia.network/'],
      blockExplorerUrls: ['https://pangolin.subscan.io/'],
    },
    facade: {
      logo: '/image/pangolin-button-mobile.png',
      logoWithText: '/image/pangolin-logo.svg',
    },
    fullName: 'Pangolin',
    isTest: true,
    lockEvents: [
      {
        min: 0,
        max: null,
        key: '0x50ea63d9616704561328b9e0febe21cfae7a79191c90e76297e0895605b8b457',
      },
    ],
    name: 'pangolin',
    provider: {
      rpc: 'wss://pangolin-rpc.darwinia.network',
      etherscan: 'wss://ropsten.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
    },
    ss58Prefix: 18,
    tokenContract: {
      native: 'PRING',
      issuingDarwinia: '0x49262B932E439271d05634c32978294C7Ea15d0C', // e2d redeem address
      bankEthereum: '0x98fAE9274562FE131e2CF5771ebFB0bB232aFd25', // d2e claim address
      bankDarwinia: '0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e', // e2d redeem deposit address
    },
    type: ['polkadot', 'darwinia'],
  },
  ropsten: {
    api: {
      subql: '',
      evolution: EVOLUTION_DOMAIN.dev,
      dapp: 'https://api.darwinia.network.l2me.com',
      subscan: '',
    },
    erc20Token: {
      bankingAddress: '0xb2Bea2358d817dAE01B0FD0DC3aECB25910E65AA',
      mappingAddress: '0xcB8531Bc0B7C8F41B55CF4E94698C37b130597B9',
      proofAddress: '0x096dba4ef2fc920b80ae081a80d4d5ca485b407d88f37d5fd6a2c59e5a696691',
    },
    ethereumChain: {
      chainId: '3',
      chainName: '',
      nativeCurrency: {
        decimals: 18,
      },
      rpcUrls: [],
    },
    facade: {
      logo: '/image/eth-logo.svg',
      logoWithText: '',
    },
    fullName: 'Ropsten',
    isTest: true,
    name: 'ropsten',
    provider: {
      rpc: '',
      etherscan: 'wss://ropsten.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
    },
    ss58Prefix: 18,
    tokenContract: {
      native: 'eth',
      ring: '0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0', // e2d ring balance address
      kton: '0x1994100c58753793D52c6f457f189aa3ce9cEe94', // e2d kton balance address
      registryEth: '0x6982702995b053A21389219c1BFc0b188eB5a372', // e2d cross chain fee querying address
      issuingDarwinia: '0x49262B932E439271d05634c32978294C7Ea15d0C', // e2d issuing address
      bankEthereum: '0x98fAE9274562FE131e2CF5771ebFB0bB232aFd25', // d2e redeem address
      bankDarwinia: '0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e', // e2d redeem deposit address
    },
    type: ['ethereum'],
  },
  tron: {
    api: {
      subql: '',
      evolution: '',
      dapp: 'https://api.darwinia.network',
      subscan: '',
    },
    erc20Token: {
      bankingAddress: '',
      mappingAddress: '',
      proofAddress: '',
    },
    ethereumChain: {
      chainId: '',
      chainName: '',
      nativeCurrency: {
        decimals: NaN,
      },
      rpcUrls: [],
    },
    facade: {
      logo: '',
      logoWithText: '',
    },
    fullName: 'Tron',
    isTest: false,
    name: 'tron',
    provider: {
      rpc: '',
      etherscan: '',
    },
    ss58Prefix: 18,
    tokenContract: {
      native: '',
      ring: '', // e2d ring balance address
      kton: '', // e2d kton balance address
      registryEth: '', // e2d cross chain fee querying address
      issuingDarwinia: '', // e2d issuing address
      bankEthereum: '', // d2e redeem address
      bankDarwinia: '', // e2d redeem deposit address
    },
    type: ['tron'],
  },
};

export const NETWORK_GRAPH = new Map<Departure, Arrival[]>([
  [
    { network: Graph.crab, mode: 'native' },
    [
      { network: Graph.darwinia, status: 'pending', mode: 'native' },
      { network: Graph.darwinia, status: 'pending', mode: 'dvm' },
    ],
  ],
  [
    { network: Graph.crab, mode: 'dvm' },
    [
      { network: Graph.darwinia, status: 'pending', mode: 'native' },
      { network: Graph.darwinia, status: 'pending', mode: 'dvm' },
    ],
  ],
  [
    { network: Graph.darwinia, mode: 'native' },
    [{ network: Graph.ethereum, status: 'available', mode: 'native', stable: true }],
  ],
  [{ network: Graph.darwinia, mode: 'dvm' }, [{ network: Graph.ethereum, status: 'available', mode: 'native' }]],
  [
    { network: Graph.ethereum, mode: 'native' },
    [
      { network: Graph.darwinia, status: 'available', mode: 'native' },
      { network: Graph.darwinia, status: 'available', mode: 'dvm' },
    ],
  ],
  [
    { network: Graph.pangolin, mode: 'native' },
    [{ network: Graph.ropsten, status: 'available', mode: 'native', stable: true }],
  ],
  [{ network: Graph.pangolin, mode: 'dvm' }, [{ network: Graph.ropsten, status: 'available', mode: 'native' }]],
  [
    { network: Graph.ropsten, mode: 'native' },
    [
      { network: Graph.pangolin, status: 'available', mode: 'native', stable: true },
      { network: Graph.pangolin, status: 'available', mode: 'dvm' },
    ],
  ],
]);

/**
 * generate network configs, use dvm field to distinct whether the config is dvm config.
 */
export const NETWORKS: NetConfig[] = chain([...NETWORK_GRAPH])
  .map(
    ([departure, arrivals]) =>
      isDev ? [departure, ...arrivals] : [departure, ...arrivals.filter((item) => item.stable)] // only display stable bridge in prod
  )
  .filter((item) => item.length > 1)
  .flatten()
  .unionWith((cur, pre) => cur.mode === pre.mode && cur.network === pre.network)
  .map(({ network, mode }) => {
    const config: NetConfig = NETWORK_CONFIG[network];

    return config.type.includes('polkadot') && mode === 'native'
      ? (omit(config, 'dvm') as Omit<NetConfig, 'dvm'>)
      : config;
  })
  .sortBy((item) => item.name)
  .valueOf();

export const AIRDROP_GRAPH = new Map<Departure, Arrival[]>([
  [{ network: Graph.ethereum, mode: 'native' }, [{ network: Graph.crab, status: 'available', mode: 'native' }]],
  [{ network: Graph.tron, mode: 'native' }, [{ network: Graph.crab, status: 'available', mode: 'native' }]],
]);

export const AIRPORTS: NetConfig[] = Object.values(NETWORK_CONFIG)
  .filter((item) => ['ethereum', 'crab', 'tron'].includes(item.name))
  .map((item) => omit(item, 'dvm'));

/* -------------------------------------------------Network Simple-------------------------------------------------------- */

interface NetworkSimpleInfo {
  prefix: number;
  network?: string;
  hasLink?: boolean;
  name?: string;
}

const networkSimple: Record<string, NetworkSimpleInfo> = {
  acala: {
    hasLink: true,
    name: 'Acala Mandala',
    network: 'acala-testnet',
    prefix: 42,
  },
  'acala mainnet': {
    prefix: 10,
  },
  alphaville: {
    prefix: 25,
  },
  ares: {
    prefix: 34,
  },
  aventus: {
    prefix: 65,
  },
  basilisk: {
    prefix: 10041,
  },
  bifrost: {
    hasLink: true,
    network: 'bifrost',
    prefix: 6,
  },
  calamari: {
    prefix: 78,
  },
  chainx: {
    hasLink: true,
    network: 'chainx',
    prefix: 44,
  },
  clover: {
    hasLink: true,
    network: 'clover',
    prefix: 42,
  },
  'clover-testnet': {
    hasLink: true,
    network: 'clover-testnet',
    prefix: 42,
  },
  cord: {
    prefix: 29,
  },
  crab: {
    hasLink: true,
    network: 'crab',
    prefix: 42,
  },
  crust: {
    hasLink: true,
    network: 'crust',
    prefix: 42,
  },
  'crust mainnet': {
    prefix: 66,
  },
  dark: {
    prefix: 17,
  },
  darwinia: {
    hasLink: true,
    network: 'darwinia',
    prefix: 18,
  },
  datahighway: {
    hasLink: true,
    network: 'datahighway',
    prefix: 33,
  },
  'datahighway-harbour': {
    hasLink: true,
    network: 'datahighway-harbour',
    prefix: 42,
  },
  dbc: {
    hasLink: true,
    network: 'dbc',
    prefix: 42,
  },
  dock: {
    hasLink: true,
    network: 'dock',
    prefix: 22,
  },
  'dock testnet': {
    prefix: 21,
  },
  ed25519: {
    prefix: 3,
  },
  edgeware: {
    hasLink: true,
    network: 'edgeware',
    prefix: 7,
  },
  equilibrium: {
    hasLink: true,
    network: 'equilibrium',
    prefix: 67,
  },
  gateway: {
    hasLink: true,
    network: 'gateway-testnet',
    prefix: 42,
  },
  geek: {
    prefix: 19,
  },
  hydradx: {
    prefix: 63,
  },
  jupiter: {
    prefix: 26,
  },
  karura: {
    hasLink: true,
    network: 'karura',
    prefix: 8,
  },
  katalchain: {
    prefix: 4,
  },
  kilt: {
    hasLink: true,
    name: 'kilt-testnet',
    network: 'kilt-testnet',
    prefix: 38,
  },
  kulupu: {
    hasLink: true,
    network: 'kulupu',
    prefix: 16,
  },
  kusama: {
    hasLink: true,
    network: 'kusama',
    prefix: 2,
  },
  laminar: {
    hasLink: true,
    network: 'laminar-testnet',
    prefix: 42,
  },
  'laminar mainnet': {
    prefix: 11,
  },
  litentry: {
    network: 'litentry', // hasLink: true,
    prefix: 31,
  },
  manta: {
    hasLink: true,
    network: 'manta-testnet',
    prefix: 77,
  },
  moonbean: {
    prefix: 1284,
  },
  moonriver: {
    prefix: 1285,
  },
  neatcoin: {
    prefix: 48,
  },
  nodle: {
    prefix: 37,
  },
  pangolin: {
    hasLink: true,
    network: 'pangolin',
    prefix: 18,
  },
  patract: {
    prefix: 27,
  },
  phala: {
    hasLink: true,
    network: 'phala',
    prefix: 42,
  },
  'phala mainnet': {
    prefix: 30,
  },
  plasm: {
    hasLink: true,
    network: 'plasm',
    prefix: 5,
  },
  poli: {
    prefix: 41,
  },
  polkadot: {
    hasLink: true,
    network: 'polkadot',
    prefix: 0,
  },
  polymath: {
    prefix: 12,
  },
  reynolds: {
    prefix: 9,
  },
  robonomics: {
    prefix: 32,
  },
  rococo: {
    hasLink: true,
    network: 'rococo',
    prefix: 42,
  },
  secp256k1: {
    prefix: 43,
  },
  shift: {
    prefix: 23,
  },
  'social-network': {
    prefix: 252,
  },
  sora: {
    network: 'sora', // hasLink: true,
    prefix: 69,
  },
  sr25519: {
    prefix: 1,
  },
  subsocial: {
    prefix: 28,
  },
  substrate: {
    prefix: 42,
  },
  substratee: {
    prefix: 13,
  },
  synesthesia: {
    prefix: 15,
  },
  totem: {
    prefix: 14,
  },
  uniarts: {
    prefix: 45,
  },
  vln: {
    prefix: 35,
  },
  westend: {
    hasLink: true,
    network: 'westend',
    prefix: 42,
  },
  zero: {
    prefix: 24,
  },
};

export const NETWORK_SIMPLE: Required<NetworkSimpleInfo>[] = Object.entries(networkSimple).map(([key, value]) => ({
  network: key,
  name: value.name || value.network || key,
  hasLink: !!value.hasLink,
  prefix: value.prefix,
}));
