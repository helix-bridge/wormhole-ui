interface Transfer {
  amount: string;
  fee: string;
  fromId: string;
  timestamp: string;
  toId: string;
  tokenId: 'balances' | 'kton';
  // eslint-disable-next-line id-denylist
  block: { blockHash: string; number: number; specVersion: number };
}

export interface Substrate2DVMRecordsRes {
  transfers: {
    totalCount: number;
    nodes: Transfer[];
  };
}

export type DVM2SubstrateRecordsRes = Substrate2DVMRecordsRes;

export type Substrate2DVMRecord = Transfer;

export type DVM2SubstrateRecord = Transfer;
