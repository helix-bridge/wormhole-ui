import store from 'store';
import { StorageInfo } from '../../model';

export const STORAGE_KEY = 'wormhole';

export function updateStorage(data: Partial<StorageInfo>): void {
  const origin = store.get(STORAGE_KEY);

  store.set(STORAGE_KEY, { ...origin, ...data });
}

export function readStorage(): StorageInfo {
  return store.get(STORAGE_KEY) || {};
}
