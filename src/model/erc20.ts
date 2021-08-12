import BN from 'bn.js';

export interface Erc20Token {
  address: string;
  source: string;
  backing: string;
  symbol: string;
  decimals: string;
  name: string;
  logo: string;
  status: string;
  balance: BN;
}

// eslint-disable-next-line no-magic-numbers
export type Erc20RegisterStatus = 0 | 1 | 2;
