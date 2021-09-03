import { Network } from './network';

export interface HistoryRouteParam {
  network: Network;
  sender: string;
  state: 'inprogress' | 'completed';
}
