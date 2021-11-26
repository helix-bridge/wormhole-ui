import { THEME } from '../config';
import { HashInfo } from '../utils';
import { NetworkConfig } from './network';

export interface StorageInfo extends HashInfo {
  theme?: THEME;
  enableTestNetworks?: boolean;
  config?: Partial<NetworkConfig>;
}
