import { ChainConfig } from '../model';

export interface RecordComponentProps<T, D = ChainConfig, A = ChainConfig> {
  record: T;
  departure: D | null;
  arrival: A | null;
}
