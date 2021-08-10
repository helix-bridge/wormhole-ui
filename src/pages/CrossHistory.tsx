import { Button } from 'antd';
import { Trans } from 'react-i18next';
import { Link, RouteComponentProps } from 'react-router-dom';
import { Records } from '../components/records/Records';
import { Path } from '../config/routes';

export function HistoryRecords(_: RouteComponentProps) {
  return (
    <div
      id="history-records"
      className="w-full mx-auto max-w-6xl relative pb-4 overflow-y-scroll"
      style={{ height: 'calc(100vh - 64px - 64px)' }}
    >
      <Records></Records>
      <Link to={Path.root} className="fixed bottom-2 left-2 sm:left-16 lg:left-36">
        <Button>
          <Trans>Go Back</Trans>
        </Button>
      </Link>
    </div>
  );
}
