import { Button, Space } from 'antd';
import { ComponentProps } from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Records } from '../components/records/records';
import { Path } from '../config/routes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HistoryRecords(props: ComponentProps<any>) {
  console.info('%c [ props ]-8', 'font-size:13px; background:pink; color:#bf2c9f;', props);

  return (
    <div className="w-full text-center">
      <Space direction="vertical" size="large" className="w-full max-w-6xl">
        <Records></Records>
        <Link to={Path.root}>
          <Button>
            <Trans>Go Back</Trans>
          </Button>
        </Link>
      </Space>
    </div>
  );
}
