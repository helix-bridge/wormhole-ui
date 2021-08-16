// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

export interface DListRes<T> {
  count: number;
  list: T[];
}
