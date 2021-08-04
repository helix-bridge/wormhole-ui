import { Network } from './network';

export interface RecordsParam {
  network: Network;
  sender: string;
  state: 'inProgress' | 'completed';
}
