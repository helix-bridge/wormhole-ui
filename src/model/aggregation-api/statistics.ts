import { NetworkMode } from '../network';

export interface DailyStatistic {
  id: string;
  dailyVolume: string;
  dailyCount: number;
}

export interface Substrate2SubstrateRecord {
  id: string;
  bridge: string;
  fromChain: string;
  fromChainMode: NetworkMode;
  toChain: string;
  toChainMode: NetworkMode;
  laneId: string;
  nonce: string;
  requestTxHash: string;
  responseTxHash: string;
  sender: string;
  recipient: string;
  token: string;
  amount: string;
  startTime: string;
  endTime: string;
  result: number;
}
