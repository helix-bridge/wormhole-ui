import { Space, Typography } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type AirdropProps = { signature: string };

export function AirdropSuccess({ signature = '{}' }: AirdropProps) {
  const { t } = useTranslation();
  // eslint-disable-next-line no-magic-numbers
  const value = useMemo(() => JSON.stringify(JSON.parse(signature), undefined, 4), [signature]);

  return (
    <Space direction="vertical">
      <Typography.Title level={5}>
        {t('Success! Please copy the signature below, and [claim] in Darwinia Wallet')}
      </Typography.Title>
      <Typography.Text copyable>{value}</Typography.Text>
    </Space>
  );
}
