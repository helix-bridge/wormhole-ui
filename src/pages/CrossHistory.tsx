import { RouteComponentProps } from 'react-router-dom';
import { Records } from '../components/records/Records';

export function HistoryRecords(_: RouteComponentProps) {
  return (
    <div id="history-records" className="w-full mx-auto max-w-6xl relative">
      <Records></Records>
    </div>
  );
}
