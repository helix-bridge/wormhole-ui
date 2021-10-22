import { NetConfig } from '../model';

export interface RecordComponentProps<T> {
  record: T;
  departure: NetConfig | null;
  arrival: NetConfig | null;
}
