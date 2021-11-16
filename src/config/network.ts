import { chain, omit } from 'lodash';
import { Arrival, Departure, ChainConfig, NetworkConfig } from '../model';

const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

export enum Graph {
  crab = 'crab',
  darwinia = 'darwinia',
  ethereum = 'ethereum',
  pangolin = 'pangolin',
  pangoro = 'pangoro',
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
      dapp: 'https://api.darwinia.network',
      evolution: EVOLUTION_DOMAIN.product,
      subGraph: '',
      subql: 'https://api.subquery.network/sq/darwinia-network/crab',
      subscan: 'https://crab.subscan.io',
    },
    contracts: {
      e2dvm: {
        proof: '',
        redeem: '',
        issuing: '',
      },
    },
    dvm: {
      kton: '0xbfE9E136270cE46A2A6a8E8D54718BdAEBEbaA3D',
      ring: '0x588abe3F7EE935137102C5e2B8042788935f4CB0',
    },
    ethereumChain: {
      blockExplorerUrls: ['https://crab.subscan.io/'],
      chainId: '44',
      chainName: 'crab',
      nativeCurrency: {
        decimals: 18,
        symbol: 'CRAB',
      },
      rpcUrls: ['https://crab-rpc.darwinia.network/'],
    },
    facade: {
      logo: '/image/crab-button-mobile.png',
      logoMinor: '/image/crab.svg',
      logoWithText: '/image/crab-logo.svg',
    },
    fullName: 'Darwinia Crab',
    isTest: false,
    name: 'crab',
    provider: {
      etherscan: '',
      rpc: 'wss://crab-rpc.darwinia.network',
    },
    ss58Prefix: 42,
    type: ['polkadot', 'darwinia'],
  },
  darwinia: {
    api: {
      dapp: 'https://api.darwinia.network',
      evolution: EVOLUTION_DOMAIN.product,
      subGraph: '',
      subql: 'https://api.subquery.network/sq/darwinia-network/darwinia',
      subscan: '',
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
    },
    facade: {
      logo: '/image/darwinia-button-mobile.png',
      logoMinor: '/image/darwinia.svg',
      logoWithText: '/image/darwinia-logo.svg',
    },
    fullName: 'Darwinia',
    isTest: false,
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
    name: 'darwinia',
    provider: {
      etherscan: '',
      rpc: 'wss://rpc-alt.darwinia.network',
    },
    ss58Prefix: 18,
    type: ['polkadot', 'darwinia'],
  },
  ethereum: {
    api: {
      dapp: 'https://api.darwinia.network',
      evolution: EVOLUTION_DOMAIN.product,
      subGraph: '',
      subql: '',
      subscan: '',
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
      logoMinor: '/image/eth.svg',
      logoWithText: '',
    },
    fullName: 'Ethereum',
    isTest: false,
    name: 'ethereum',
    provider: {
      etherscan: 'wss://mainnet.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
      rpc: '',
    },
    type: ['ethereum'],
  },
  pangolin: {
    api: {
      dapp: 'https://api.darwinia.network.l2me.com',
      evolution: EVOLUTION_DOMAIN.dev,
      subGraph: 'http://t1.pangolin-p2p.darwinia.network:8000/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      subql: 'https://api.subquery.network/sq/darwinia-network/pangolin',
      subscan: '',
    },
    contracts: {
      e2d: {
        fee: '0x6982702995b053A21389219c1BFc0b188eB5a372',
        issuing: '0x49262B932E439271d05634c32978294C7Ea15d0C',
        kton: '0x1994100c58753793D52c6f457f189aa3ce9cEe94',
        redeem: '0x98fAE9274562FE131e2CF5771ebFB0bB232aFd25',
        redeemDeposit: '0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e',
        ring: '0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0',
      },
      e2dvm: {
        proof: '0x096dba4ef2fc920b80ae081a80d4d5ca485b407d88f37d5fd6a2c59e5a696691',
        redeem: '0xb2Bea2358d817dAE01B0FD0DC3aECB25910E65AA',
        issuing: '0x49262B932E439271d05634c32978294C7Ea15d0C',
      },
    },
    dvm: {
      kton: '0xc8C1680B18D432732D07c044669915726fAF67D0',
      ring: '0xbBD91aD844557ADCbb97296216b3B3c977FCC4F2',
    },
    ethereumChain: {
      blockExplorerUrls: ['https://pangolin.subscan.io/'],
      chainId: '43',
      chainName: 'pangolin',
      nativeCurrency: {
        decimals: 18,
        symbol: 'PRING',
      },
      rpcUrls: ['https://pangolin-rpc.darwinia.network/'],
    },
    facade: {
      logo: '/image/pangolin-button-mobile.png',
      logoMinor: '/image/pangolin.svg',
      logoWithText: '/image/pangolin-logo.svg',
    },
    fullName: 'Pangolin',
    isTest: true,
    lockEvents: [
      {
        key: '0x50ea63d9616704561328b9e0febe21cfae7a79191c90e76297e0895605b8b457',
        max: null,
        min: 0,
      },
    ],
    name: 'pangolin',
    provider: {
      etherscan: 'wss://ropsten.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
      rpc: 'wss://pangolin-rpc.darwinia.network',
    },
    ss58Prefix: 18,
    type: ['polkadot', 'darwinia'],
  },
  pangoro: {
    api: {
      dapp: 'https://api.darwinia.network.l2me.com',
      evolution: EVOLUTION_DOMAIN.dev,
      subGraph: 'http://t1.pangolin-p2p.darwinia.network:8000/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      subql: 'https://api.subquery.network/sq/darwinia-network/pangoro',
      subscan: '',
    },
    facade: {
      logo: '/image/pangoro-button-mobile.png',
      logoMinor: '/image/pangoro-button-mobile.png',
      logoWithText: '',
    },
    fullName: 'Pangoro',
    isTest: true,
    name: 'pangoro',
    provider: {
      etherscan: '',
      rpc: 'wss://pangoro-rpc.darwinia.network',
    },
    ss58Prefix: 42,
    type: ['polkadot', 'darwinia'],
  },
  ropsten: {
    api: {
      dapp: 'https://api.darwinia.network.l2me.com',
      evolution: EVOLUTION_DOMAIN.dev,
      subGraph: '',
      subql: '',
      subscan: '',
    },
    contracts: {
      e2d: {
        fee: '0x6982702995b053A21389219c1BFc0b188eB5a372',
        issuing: '0x49262B932E439271d05634c32978294C7Ea15d0C',
        kton: '0x1994100c58753793D52c6f457f189aa3ce9cEe94',
        redeem: '0x98fAE9274562FE131e2CF5771ebFB0bB232aFd25',
        redeemDeposit: '0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e',
        ring: '0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0',
      },
      e2dvm: {
        proof: '0x096dba4ef2fc920b80ae081a80d4d5ca485b407d88f37d5fd6a2c59e5a696691',
        redeem: '0xb2Bea2358d817dAE01B0FD0DC3aECB25910E65AA',
        issuing: '0x49262B932E439271d05634c32978294C7Ea15d0C',
      },
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
      logoMinor: '/image/eth.svg',
      logoWithText: '',
    },
    fullName: 'Ropsten',
    isTest: true,
    name: 'ropsten',
    provider: {
      etherscan: 'wss://ropsten.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
      rpc: '',
    },
    type: ['ethereum'],
  },
  tron: {
    api: {
      dapp: 'https://api.darwinia.network',
      evolution: '',
      subGraph: '',
      subql: '',
      subscan: '',
    },
    facade: {
      logo: '/image/tron-button-mobile.png',
      logoMinor: '/image/tron-button-mobile.png',
      logoWithText: '',
    },
    fullName: 'Tron',
    isTest: false,
    name: 'tron',
    provider: {
      etherscan: '',
      rpc: '',
    },
    type: ['tron'],
  },
};

export const NETWORK_GRAPH = new Map<Departure, Arrival[]>([
  [{ network: Graph.crab, mode: 'native' }, [{ network: Graph.darwinia, status: 'pending', mode: 'native' }]],
  [
    { network: Graph.crab, mode: 'dvm' },
    [
      { network: Graph.darwinia, status: 'pending', mode: 'native' },
      { network: Graph.ethereum, status: 'available', mode: 'native' },
    ],
  ],
  [
    { network: Graph.darwinia, mode: 'native' },
    [{ network: Graph.ethereum, status: 'available', mode: 'native', stable: true }],
  ],
  [
    { network: Graph.ethereum, mode: 'native' },
    [
      { network: Graph.darwinia, status: 'available', mode: 'native' },
      { network: Graph.crab, status: 'available', mode: 'dvm' },
    ],
  ],
  [
    { network: Graph.pangolin, mode: 'native' },
    [{ network: Graph.ropsten, status: 'available', mode: 'native', stable: true }],
  ],
  [
    { network: Graph.pangolin, mode: 'dvm' },
    [
      { network: Graph.ropsten, status: 'available', mode: 'native' },
      { network: Graph.pangoro, status: 'available', mode: 'native', stable: true },
    ],
  ],
  [
    { network: Graph.pangoro, mode: 'native' },
    [{ network: Graph.pangolin, status: 'available', mode: 'dvm', stable: true }],
  ],
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
export const NETWORKS: ChainConfig[] = chain([...NETWORK_GRAPH])
  .map(
    ([departure, arrivals]) =>
      isDev ? [departure, ...arrivals] : [departure, ...arrivals.filter((item) => item.stable)] // only display stable bridge in prod
  )
  .filter((item) => item.length > 1)
  .flatten()
  .unionWith((cur, pre) => cur.mode === pre.mode && cur.network === pre.network)
  .map(({ network, mode }) => {
    const config: ChainConfig = NETWORK_CONFIG[network];

    return config.type.includes('polkadot') && mode === 'native'
      ? (omit(config, 'dvm') as Omit<ChainConfig, 'dvm'>)
      : config;
  })
  .sortBy((item) => item.name)
  .valueOf();

export const AIRDROP_GRAPH = new Map<Departure, Arrival[]>([
  [{ network: Graph.ethereum, mode: 'native' }, [{ network: Graph.crab, status: 'available', mode: 'native' }]],
  [{ network: Graph.tron, mode: 'native' }, [{ network: Graph.crab, status: 'available', mode: 'native' }]],
]);

export const AIRPORTS: ChainConfig[] = Object.values(NETWORK_CONFIG)
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
