import { THEME } from '../config';
import { HashInfo } from '../utils';
import { Network, NetworkConfig } from './network';

export interface StorageInfo extends HashInfo {
  theme?: THEME;
  enableTestNetworks?: boolean;
  config?: Partial<NetworkConfig>;
  custom?: Network[];
}
