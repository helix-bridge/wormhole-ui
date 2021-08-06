import { Network } from '../network';

export interface RingBurnRecord extends E2DRecord {
  id: number;
}

export interface E2DRecord {
  address: string;
  amount: string;
  block_num: number;
  block_timestamp: number;
  chain: Network;
  created_at: string;
  currency: string;
  target: string;
  tx: string;
}

export interface RedeemRecord extends E2DRecord {
  darwinia_tx: string;
  deposit: string; // json string
  is_relayed: boolean;
}
