import { THEME } from '../config';
import { HashInfo } from '../utils';

export interface StorageInfo extends HashInfo {
  theme?: THEME;
  enableTestNetworks?: boolean;
}
