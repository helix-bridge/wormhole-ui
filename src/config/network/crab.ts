import { EVOLUTION_DOMAIN } from '../network';
import { CrabConfig } from '../../model';

export const crabConfig: CrabConfig = {
  // move to bridge
  api: {
    dapp: 'https://api.darwinia.network',
    evolution: EVOLUTION_DOMAIN.product,
    subGraph: 'https://crab-thegraph.darwinia.network/subgraphs/name/wormhole/Sub2SubMappingTokenFactory',
    subql: 'https://api.subquery.network/sq/darwinia-network/wormhole-crab',
    subscan: 'https://crab.subscan.io',
  },
  // move to bridge
  contracts: {
    e2dvm: {
      proof: '',
      redeem: '',
      issuing: '',
    },
  },

  // dvm 和 ethereumChain 是 DVM 链的配置
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

  // common config
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
  type: ['polkadot', 'darwinia'],
  // polkadot chain config
  ss58Prefix: 42,
};
