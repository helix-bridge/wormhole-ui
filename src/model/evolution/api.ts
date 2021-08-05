// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EResponse<T = any> {
  code: number;
  detail: string;
  data?: T;
}

export type ListRes<T> = { list: T[] };
