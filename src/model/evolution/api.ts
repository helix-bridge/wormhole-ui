// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IResponse<T = any> {
  code: number;
  detail: string;
  data?: T;
}
