import { DVMChainConfig } from '../../model';

export const DVMChainConfig: DVMChainConfig = {
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
  name: 'pangolin',
  provider: {
    etherscan: 'wss://ropsten.infura.io/ws/v3/5350449ccd2349afa007061e62ee1409',
    rpc: 'wss://pangolin-rpc.darwinia.network',
  },
  ss58Prefix: 42,
  type: ['polkadot', 'darwinia'],
};
