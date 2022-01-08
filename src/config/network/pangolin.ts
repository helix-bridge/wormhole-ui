import { EVOLUTION_DOMAIN } from '../network';
import { PangolinConfig } from '../../model';

export const pangolinConfig: PangolinConfig = {
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
};
