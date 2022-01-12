import { Config } from '../common';
import { Network } from './network';

export interface Facade {
  logo: string;
  logoMinor: string;
  logoWithText: string;
}

/* ----------------------------------------Network Theme config-------------------------------------------------- */

export type NetworkThemeConfig<T> = Config<Network, T>;
