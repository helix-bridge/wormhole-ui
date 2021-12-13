import { chain, omit } from 'lodash';
import { Arrival, Departure, ChainConfig, NetworkConfig } from '../model';
import { getCustomNetworkConfig } from '../utils/helper/storage';

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
const allowAlias: (full: string, at?: number) => string[] = (name, startAt = 3) => {
  const len = name.length;
  const shortestName = name.substr(0, startAt);

  return new Array(len - startAt).fill('').map((_, index) => shortestName + name.substr(startAt, index));
};

export const NETWORK_ALIAS = new Map([[Graph.ethereum, [...allowAlias(Graph.ethereum)]]]);

const EVOLUTION_DOMAIN = {
  product: 'https://www.evolution.land',
  dev: 'https://www.evolution.land.l2me.com',
};

export const SYSTEM_NETWORK_CONFIG: NetworkConfig = {
  crab: {
    api: {
      dapp: 'https://api.darwinia.network',
      evolution: EVOLUTION_DOMAIN.product,
      subGraph: 'http://t1.pangolin-p2p.darwinia.network:8000/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-crab',
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
      logo: '/image/crab.png',
      logoMinor: '/image/crab.svg',
      logoWithText: '/image/crab-logo.svg',
    },
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
      subGraph: 'http://t1.pangolin-p2p.darwinia.network:8000/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-darwinia',
      subqlMMr: 'https://api.subquery.network/sq/darwinia-network/darwinia-mmr',
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
      logo: '/image/darwinia.png',
      logoMinor: '/image/darwinia.svg',
      logoWithText: '/image/darwinia-logo.svg',
    },
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
  },
  pangolin: {
    api: {
      dapp: 'https://api.darwinia.network.l2me.com',
      evolution: EVOLUTION_DOMAIN.dev,
      subGraph: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-pangolin',
      subqlMMr: 'https://api.subquery.network/sq/darwinia-network/pangolin-mmr',
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
      kton: '0xDCd3bC4138afE6F324eaA12C356A20cD576edF08',
      ring: '0xcfDEb76be514c8B8DC8B509E63f95E34ebafD81e',
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
      logo: '/image/pangolin.png',
      logoMinor: '/image/pangolin.svg',
      logoWithText: '/image/pangolin-logo.svg',
    },
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
    ss58Prefix: 42,
    type: ['polkadot', 'darwinia'],
  },
  pangoro: {
    api: {
      dapp: 'https://api.darwinia.network.l2me.com',
      evolution: EVOLUTION_DOMAIN.dev,
      subGraph: 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
      subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-pangoro',
    },
    facade: {
      logo: '/image/pangoro.png',
      logoMinor: '/image/pangoro.png',
      logoWithText: '',
    },
    isTest: true,
    name: 'pangoro',
    provider: {
      etherscan: '',
      rpc: 'wss://pangoro-rpc.darwinia.network',
    },
    ss58Prefix: 18,
    type: ['polkadot', 'darwinia'],
  },
  ropsten: {
    api: {
      dapp: 'https://api.darwinia.network.l2me.com',
      evolution: EVOLUTION_DOMAIN.dev,
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
      logoMinor: '/image/ropsten.svg',
      logoWithText: '',
    },
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
    },
    facade: {
      logo: '/image/tron.png',
      logoMinor: '/image/tron.png',
      logoWithText: '',
    },
    isTest: false,
    name: 'tron',
    provider: {
      etherscan: '',
      rpc: '',
    },
    type: ['tron'],
  },
};

const CUSTOM_NETWORK_CONFIG = getCustomNetworkConfig();

export const NETWORK_CONFIG = { ...SYSTEM_NETWORK_CONFIG, ...CUSTOM_NETWORK_CONFIG };

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

export const NETWORK_CONFIG_DESCRIPTIONS: {
  path: string[];
  editable: boolean;
  comment: string;
  type?: 'string' | 'boolean' | 'number' | 'array';
}[] = [
  { path: ['api'], editable: true, comment: 'Index service endpoints' },
  {
    path: ['api', 'dapp'],
    editable: true,
    comment: 'Endpoint of proof after registering Erc20 Token',
    type: 'string',
  },
  { path: ['api', 'evolution'], editable: true, comment: 'Deposit querying endpoint', type: 'string' },
  { path: ['api', 'subGraph'], editable: true, comment: 'The graph endpoint', type: 'string' },
  { path: ['api', 'subql'], editable: true, comment: 'Subql endpoint', type: 'string' },
  { path: ['api', 'subscan'], editable: true, comment: 'Airdrop endpoint', type: 'string' },
  { path: ['api', 'subqlMMr'], editable: true, comment: 'MMR endpoint deployed on subql', type: 'string' },

  { path: ['contracts'], editable: true, comment: 'Contracts address in DVM or Ethereum' },
  { path: ['contracts', 'e2d'], editable: true, comment: 'Ethereum to Darwinia' },
  { path: ['contracts', 'e2d', 'fee'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2d', 'issuing'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2d', 'kton'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2d', 'redeem'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2d', 'redeemDeposit'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2d', 'ring'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2dvm'], editable: true, comment: 'Ethereum to DVM' },
  { path: ['contracts', 'e2dvm', 'proof'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2dvm', 'redeem'], editable: true, comment: '', type: 'string' },
  { path: ['contracts', 'e2dvm', 'issuing'], editable: true, comment: '', type: 'string' },

  { path: ['facade'], editable: true, comment: 'Appearance of the application' },
  { path: ['facade', 'logo'], editable: true, comment: '', type: 'string' },
  { path: ['facade', 'logoMinor'], editable: true, comment: '', type: 'string' },
  { path: ['facade', 'logoWithText'], editable: true, comment: '', type: 'string' },

  {
    path: ['isTest'],
    editable: false,
    comment: 'Identifies whether the current network is a test network',
    type: 'boolean',
  },

  { path: ['lockEvents'], editable: true, comment: '', type: 'array' },
  { path: ['lockEvents', 'key'], editable: true, comment: '', type: 'string' },
  { path: ['lockEvents', 'max'], editable: true, comment: '', type: 'number' },
  { path: ['lockEvents', 'min'], editable: true, comment: '', type: 'number' },

  { path: ['name'], editable: false, comment: '', type: 'string' },

  { path: ['provider'], editable: true, comment: 'RPC providers' },
  { path: ['provider', 'etherscan'], editable: true, comment: 'RPC provider in DVM or Ethereum', type: 'string' },
  { path: ['provider', 'rpc'], editable: true, comment: 'RPC provider in Substrate', type: 'string' },

  { path: ['ss58Prefix'], editable: false, comment: '', type: 'number' },

  { path: ['type'], editable: true, comment: 'The network types', type: 'array' },

  { path: ['dvm'], editable: true, comment: 'Network related information in DVM' },
  { path: ['dvm', 'kton'], editable: true, comment: '', type: 'string' },
  { path: ['dvm', 'ring'], editable: true, comment: '', type: 'string' },

  { path: ['ethereumChain'], editable: true, comment: 'Ethereum related information' },
  { path: ['ethereumChain', 'blockExplorerUrls'], editable: true, comment: '', type: 'array' },
  { path: ['ethereumChain', 'chainId'], editable: false, comment: '', type: 'string' },
  { path: ['ethereumChain', 'chainName'], editable: true, comment: '', type: 'string' },
  { path: ['ethereumChain', 'nativeCurrency', 'decimals'], editable: false, comment: '', type: 'number' },
  { path: ['ethereumChain', 'nativeCurrency', 'symbol'], editable: false, comment: '', type: 'string' },
  { path: ['ethereumChain', 'rpcUrls'], editable: true, comment: '', type: 'array' },
];
