import { Button } from 'antd';
import { ComponentProps } from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Records } from '../components/records/Records';
import { Path } from '../config/routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HistoryRecords(_: ComponentProps<any>) {
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
