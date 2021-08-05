export interface Action<U, T = string> {
  type: U;
  payload: T;
}

export type Config<T extends string, U> = { [key in T]: U };

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithNull<T> = { [K in keyof T]: T[K] | null };
