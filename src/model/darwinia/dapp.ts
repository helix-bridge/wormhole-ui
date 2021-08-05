export interface RingBurnRecord {
  address: string;
  amount: string;
  block_num: number;
  block_timestamp: string;
  chain: string;
  created_at: string;
  currency: string;
  id: number;
  target: string;
  tx: string;
}

export interface RedeemRecord {
  address: string;
  amount: string;
  block_num: number;
  block_timestamp: number;
  chain: string;
  currency: string;
  darwinia_tx: string;
  deposit: string; // json string
  is_relayed: boolean;
  target: string;
  tx: string;
}
