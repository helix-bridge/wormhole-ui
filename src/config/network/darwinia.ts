import { DarwiniaConfig } from '../../model';

export const darwiniaConfig: DarwiniaConfig = {
  facade: {
    logo: '/image/darwinia.png',
    logoMinor: '/image/darwinia.svg',
    logoWithText: '/image/darwinia-logo.svg',
  },
  isTest: false,
  name: 'darwinia',
  provider: {
    etherscan: '',
    rpc: 'wss://rpc.darwinia.network',
  },
  ss58Prefix: 18,
  type: ['polkadot', 'darwinia'],
};
