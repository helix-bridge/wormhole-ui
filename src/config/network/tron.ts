import { TronConfig } from '../../model';

export const tronConfig: TronConfig = {
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
