// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EResponse<T = any> {
  code: number;
  detail: string;
  data?: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListRes<T> = { list: T[]; [key: string]: any };
