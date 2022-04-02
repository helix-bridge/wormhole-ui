import { Substrate2SubstrateDVMRecord } from '../../bridges/substrate-substrateDVM/model';
import { Network, NetworkMode } from '../network';

export interface DailyStatistic {
  id: string;
  dailyVolume: string;
  dailyCount: number;
}

export interface Substrate2SubstrateRecord extends Substrate2SubstrateDVMRecord {
  id: string;
  bridge: string;
  fromChain: Network;
  fromChainMode: NetworkMode;
  toChain: Network;
  toChainMode: NetworkMode;
  sender: string;
  startTime: string;
  endTime: string;
}
