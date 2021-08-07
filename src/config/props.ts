import { NetConfig } from '../model';

export interface RecordComponentProps<T> {
  record: T;
  network: NetConfig | null;
}
