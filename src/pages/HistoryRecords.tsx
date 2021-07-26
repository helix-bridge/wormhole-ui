import { Link } from 'react-router-dom';
import { Path } from '../config/routes';

export function HistoryRecords() {
  return (
    <div>
      <span>History records</span>
      <Link to={Path.root}>Go back</Link>
    </div>
  );
}
