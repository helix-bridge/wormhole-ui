export type Claim = Record<string, unknown>;

export interface ClaimsRes {
  info: Claim[];
}
