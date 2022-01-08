import { TronConfig } from '../../model';

export const tronConfig: TronConfig = {
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
};
