import { Input, Space, Typography } from 'antd';
import Link from 'antd/lib/typography/Link';
import { useMemo } from 'react';
import { Trans } from 'react-i18next';

const INDENTATION = 4;

/**
 * @deprecated unused
 */
export function AirdropSuccess({ data }: { data: Record<string, unknown> }) {
  const value = useMemo(() => JSON.stringify(data, undefined, INDENTATION), [data]);

  return (
    <Space direction="vertical" className="w-full">
      <Typography.Title level={5}>
        <Trans i18nKey="claimInDarwiniaWallet">
          Success! Please copy the signature below, then claim in
          <Link href="https://apps.darwinia.network/#/claims" target="_blank">
            Darwinia Wallet
          </Link>
        </Trans>
      </Typography.Title>
      <Input.TextArea value={value} rows={10}></Input.TextArea>
    </Space>
  );
}
