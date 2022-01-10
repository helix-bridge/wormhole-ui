import { chain, omit } from 'lodash';
import { ChainConfig } from '../../model';
import { darwiniaConfig } from './darwinia';
import { ethereumConfig } from './ethereum';
import { NETWORK_GRAPH } from './graph';
import { DVMChainConfig } from './pangolin';
import { pangoroConfig } from './pangoro';
import { ropstenConfig } from './ropsten';
import { tronConfig } from './tron';

const configs = [darwiniaConfig, ethereumConfig, pangoroConfig, ropstenConfig, tronConfig, DVMChainConfig];

/**
 * generate network configs, use dvm field to distinct whether the config is dvm config.
 */
export const NETWORKS: ChainConfig[] = chain([...NETWORK_GRAPH])
  .map(([departure, arrivals]) => [departure, ...arrivals])
  .filter((item) => item.length > 1)
  .flatten()
  .unionWith((cur, pre) => cur.mode === pre.mode && cur.network === pre.network)
  .map(({ network, mode }) => {
    const config: ChainConfig | undefined = configs.find((item) => item.name === network);

    if (!config) {
      throw new Error(`Can not find ${network} network configuration`);
    }

    return config.type.includes('polkadot') && mode === 'native'
      ? (omit(config, 'dvm') as Omit<ChainConfig, 'dvm'>)
      : config;
  })
  .sortBy((item) => item.name)
  .valueOf();

export const AIRPORTS: ChainConfig[] = configs
  .filter((item) => ['ethereum', 'crab', 'tron'].includes(item.name))
  .map((item) => omit(item, 'dvm'));
