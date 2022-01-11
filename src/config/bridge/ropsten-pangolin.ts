import { omit } from 'lodash';
import { pangolinConfig, ropstenConfig } from '../network';
import { Bridge, EthereumDarwiniaBridgeConfig } from '../../model';
import { EVOLUTION_DOMAIN } from '../api';

const ropstenDVMChainConfig: EthereumDarwiniaBridgeConfig = {
  specVersion: 27020,
  api: {
    dapp: 'https://api.darwinia.network.l2me.com',
    evolution: EVOLUTION_DOMAIN.dev,
  },
  contracts: {
    fee: '0x6982702995b053A21389219c1BFc0b188eB5a372',
    issuing: '0x49262B932E439271d05634c32978294C7Ea15d0C',
    kton: '0x1994100c58753793D52c6f457f189aa3ce9cEe94',
    redeem: '0x98fAE9274562FE131e2CF5771ebFB0bB232aFd25',
    redeemDeposit: '0x6EF538314829EfA8386Fc43386cB13B4e0A67D1e',
    ring: '0xb52FBE2B925ab79a821b261C82c5Ba0814AAA5e0',
  },
  lockEvents: [
    {
      key: '0x50ea63d9616704561328b9e0febe21cfae7a79191c90e76297e0895605b8b457',
      max: null,
      min: 0,
    },
  ],
};

/**
 * ethereum <-> darwinia testnet
 */
export const ropstenPangolin = new Bridge(ropstenConfig, omit(pangolinConfig, 'dvm'), ropstenDVMChainConfig);