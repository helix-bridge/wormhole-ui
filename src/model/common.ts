export interface Action<U, T = string> {
  type: U;
  payload: T;
}

export type Config<T extends string, U> = { [key in T]: U };

export type CrossType = 'cross-chain' | 'airdrop';
