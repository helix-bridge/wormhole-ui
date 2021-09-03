import { Network } from '../network';
import { DListRes } from './api';

export interface Paginator {
  row: number;
  page: number;
}

export interface HistoryReq {
  address: string;
  network: Network;
  paginator: Paginator;
  confirmed: boolean;
}

/* ------------------------------------E2D section-------------------------------------------- */
export interface RingBurnHistory extends E2DHistory {
  id: number;
}

export type RingBurnHistoryRes = DListRes<RingBurnHistory>;

export interface E2DHistory {
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

export interface RedeemHistory extends E2DHistory {
  darwinia_tx: string;
  deposit: string; // json string
  is_relayed: boolean;
}

export type RedeemHistoryRes = DListRes<RedeemHistory>;

/* ------------------------------------D2E section-------------------------------------------- */

export interface D2EHistory {
  account_id: string;
  block_hash: string;
  block_header: string;
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  kton_value: string;
  mmr_index: number;
  mmr_root: string;
  ring_value: string;
  signatures: string;
  target: string;
  tx: string;
}

export interface D2EHistoryRes {
  count: number;
  implName: string;
  best: number;
  MMRRoot: string;
  list: D2EHistory[];
}

export type D2EMeta = Pick<D2EHistoryRes, 'best' | 'MMRRoot'>;

/* ------------------------------------ERC20 section-------------------------------------------- */

export interface Erc20RegisterProof {
  extrinsic_index: string;
  account_id: string;
  block_num: number;
  block_hash: string;
  backing: string;
  source: string;
  target: string;
  block_timestamp: number;
  mmr_index: number;
  mmr_root: string;
  signatures: string;
  block_header: string;
  tx: string;
}

export type Erc20RegisterProofRes = Erc20RegisterProof | null;
