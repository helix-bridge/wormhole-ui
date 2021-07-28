export interface Deposit {
  amount: string;
  deposit_id: number;
  deposit_time: number; // timestamp
  duration: number; // month amount
}

export type DepositResponse = { list: Deposit[] };

export interface DepositRequest {
  address: string;
}
