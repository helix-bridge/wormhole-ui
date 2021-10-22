import { RouteComponentProps } from 'react-router-dom';
import { CrossRecords } from '../components/records/CrossRecords';

export function HistoryRecords(_: RouteComponentProps) {
  return (
    <div id="history-records" className="w-full mx-auto max-w-6xl relative">
      <CrossRecords></CrossRecords>
    </div>
  );
}
