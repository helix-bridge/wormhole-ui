import { DVMChainConfig } from '../../model';

export const crabConfig: DVMChainConfig = {
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
  endpoints: {
    mmr: '',
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
  type: ['polkadot', 'darwinia'],
  ss58Prefix: 42,
};
