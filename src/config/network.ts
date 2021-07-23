import { NetConfig, Network, NetworkConfig } from '../model';

export enum NetworkEnum {
  pangolin = 'pangolin',
  crab = 'crab',
  darwinia = 'darwinia',
  ethereum = 'ethereum',
  ropsten = 'ropsten',
  tron = 'tron',
}

export const NETWORK_CONFIG: NetworkConfig = {
  crab: {
    api: {
      subql: 'https://api.subquery.network/sq/wuminzhe/crab',
    },
    ethereumChain: {
      chainId: '44',
      chainName: '',
      nativeCurrency: {
        decimals: 18,
      },
      rpcUrls: [],
    },
    facade: {
      logo: '/image/crab-button-mobile.png',
      logoWithText: '/image/crab-logo.svg',
    },
    fullName: 'Crab Mainnet',
    isTest: false,
    name: 'crab',
    rpc: 'wss://crab-rpc.darwinia.network',
    ss58Prefix: 42,
    token: {
      native: 'CRING',
    },
    type: ['polkadot', 'darwinia'],
  },
  darwinia: {
    api: {
      subql: 'https://api.subquery.network/sq/darwinia-network/darwinia',
    },
    ethereumChain: {
      chainId: '',
      chainName: '',
      nativeCurrency: {
        decimals: 18,
      },
      rpcUrls: [],
    },
    // TODO
    facade: {
      logo: '/image/darwinia-button-mobile.png',
      logoWithText: '/image/darwinia-logo.svg',
    },
    fullName: 'Darwinia Mainnet',
    isTest: false,
    name: 'darwinia',
    rpc: 'wss://rpc.darwinia.network',
    ss58Prefix: 18,
    token: {
      native: 'RING',
    },
    type: ['polkadot', 'darwinia'],
  },
  ethereum: {
    api: {
      subql: '',
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
      logo: 'image/eth-logo.svg',
      logoWithText: '',
    },
    fullName: 'Ethereum Mainnet',
    isTest: false,
    name: 'ethereum',
    rpc: '',
    ss58Prefix: null,
    token: {
      native: 'eth',
    },
    type: ['ethereum'],
  },
  pangolin: {
    api: {
      subql: 'http://t3.hkg.itering.com:3000',
    },
    ethereumChain: {
      chainId: '43',
      chainName: '',
      nativeCurrency: {
        decimals: 18,
      },
      rpcUrls: [],
    },
    facade: {
      logo: '/image/pangolin-button-mobile.png',
      logoWithText: '/image/pangolin-logo.svg',
    },
    fullName: 'Pangolin Testnet',
    isTest: true,
    name: 'pangolin',
    rpc: 'wss://pangolin-rpc.darwinia.network/',
    ss58Prefix: 18,
    token: {
      native: 'PRING',
    },
    type: ['polkadot', 'darwinia'],
  },
  ropsten: {
    api: {
      subql: '',
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
      logo: '',
      logoWithText: '',
    },
    fullName: 'Ropsten Testnet',
    isTest: true,
    name: 'ropsten',
    rpc: '',
    ss58Prefix: null,
    token: {
      native: 'eth',
    },
    type: ['ethereum'],
  },
  tron: {
    api: {
      subql: '',
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
      logo: '',
      logoWithText: '',
    },
    fullName: 'Tron Mainnet',
    isTest: false,
    name: 'tron',
    rpc: '',
    ss58Prefix: null,
    token: {
      native: 'tron',
    },
    type: ['tron'],
  },
};

export const NETWORKS: Required<NetConfig>[] = Object.values(NETWORK_CONFIG);

interface Vertices {
  network: Network;
  status: 'pending' | 'available';
  tokenBlackList?: string[];
}

export const NETWORK_GRAPH = new Map<Network, Vertices[]>([
  [NetworkEnum.crab, [{ network: NetworkEnum.darwinia, status: 'pending' }]],
  [NetworkEnum.darwinia, [{ network: NetworkEnum.ethereum, status: 'available' }]],
  [NetworkEnum.ethereum, [{ network: NetworkEnum.darwinia, status: 'available' }]],
  [NetworkEnum.pangolin, [{ network: NetworkEnum.ropsten, status: 'pending' }]],
  [NetworkEnum.ropsten, [{ network: NetworkEnum.pangolin, status: 'pending' }]],
  [NetworkEnum.tron, [{ network: NetworkEnum.darwinia, status: 'pending' }]],
]);

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
