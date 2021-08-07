import { Button } from 'antd';
import { ComponentProps } from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Records } from '../components/records/Records';
import { Path } from '../config/routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HistoryRecords(props: ComponentProps<any>) {
  console.info('%c [ props ]-8', 'font-size:13px; background:pink; color:#bf2c9f;', props);

  return (
    <div className="w-full mx-auto max-w-6xl relative">
      <Records></Records>
      <Link to={Path.root} className="absolute right-0 top-16">
        <Button size="large">
          <Trans>Go Back</Trans>
        </Button>
      </Link>
    </div>
  );
}
