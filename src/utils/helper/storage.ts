import { omit } from 'lodash';
import store from 'store';
import { ChainConfig, Network, StorageInfo } from '../../model';

export const STORAGE_KEY = 'wormhole';

export function updateStorage(data: Partial<StorageInfo>): void {
  const origin = store.get(STORAGE_KEY);

  store.set(STORAGE_KEY, { ...origin, ...data });
}

export function readStorage(): StorageInfo {
  return store.get(STORAGE_KEY) || {};
}

export function saveNetworkConfig(config: ChainConfig) {
  const { config: oConf } = readStorage();
  const nConf = { ...(oConf ?? {}), [config.name]: config };

  updateStorage({ config: nConf });
}

export function removeNetworkConfig(name: Network) {
  const { config } = readStorage();
  const nConf = omit(config, name);

  updateStorage({ config: nConf });
}
