import { RouteComponentProps } from 'react-router-dom';
import { CrossChainRecord } from '../components/record/CrossChain';

export function HistoryRecords(_: RouteComponentProps) {
  return (
    <div id="history-records" className="w-full mx-auto max-w-6xl relative">
      <CrossChainRecord></CrossChainRecord>
    </div>
  );
}
