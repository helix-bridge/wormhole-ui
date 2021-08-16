import { RouteComponentProps } from 'react-router-dom';
import { Records } from '../components/records/Records';

export function HistoryRecords(_: RouteComponentProps) {
  return (
    <div
      id="history-records"
      className="w-full mx-auto max-w-6xl relative pb-4 overflow-y-scroll"
      style={{ height: 'calc(100vh - 64px - 64px)' }}
    >
      <Records></Records>
    </div>
  );
}
