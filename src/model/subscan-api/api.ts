// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SubscanResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  generated_at: number; // timestamp
}

export interface AirdropClaimRes {
  info: Record<string, unknown>[];
}
