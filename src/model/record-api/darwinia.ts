import { Arrival, Departure } from '../bridge';

export interface DarwiniaListRes<T> {
  count: number;
  list: T[];
}

export interface Paginator {
  row: number;
  page: number;
}

export interface HistoryReq {
  address: string;
  direction: [Departure, Arrival];
  paginator: Paginator;
  confirmed: boolean | null;
}
