import { Form, Progress, Select } from 'antd';
import { Rule } from 'antd/lib/form';
import { addDays, format, fromUnixTime } from 'date-fns';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EvoApiPath, FORM_CONTROL } from '../../config';
import { useRecordsQuery } from '../../hooks';
import { CustomFormControlProps, Deposit, DepositResponse, NetConfig } from '../../model';
import { apiUrl, empty } from '../../utils';

interface DepositItemProps {
  address: string;
  config: NetConfig;
  removedIds: number[];
  rules?: Rule[];
}

export function getDepositTimeRange({ deposit_time, duration }: Pick<Deposit, 'deposit_time' | 'duration'>): {
  start: Date;
  end: Date;
} {
  const base = 30;
  const start = fromUnixTime(deposit_time);
  const end = addDays(start, base * duration);

  return { start, end };
}

// eslint-disable-next-line complexity
export function DepositItem({
  address,
  config,
  onChange = empty,
  value,
  removedIds = [],
  rules = [],
}: CustomFormControlProps<Deposit | null> & DepositItemProps) {
  const { t } = useTranslation();
  const { data, error, loading } = useRecordsQuery<DepositResponse>({
    url: apiUrl(config.api.evolution, EvoApiPath.deposit),
    params: { address },
    // url: apiUrl('https://www.evolution.land', EvoApiPath.deposit),
    // params: { address: '0xf916a4ef2de14a9d8aab6d29d122a641ecde2b28' }, // test account;
  });
  const triggerChange = useCallback(
    (id) => {
      onChange(data?.list.find((item) => item.deposit_id === +id) ?? null);
    },
    [data?.list, onChange]
  );

  if (loading) {
    return (
      <Form.Item name={FORM_CONTROL.deposit} label={t('Deposit')} rules={[{ required: true }]}>
        <Progress percent={99} status="active" strokeColor={{ from: '#5745de', to: '#ec3783' }} />
      </Form.Item>
    );
  }

  if (!data || error) {
    return (
      <Form.Item name={FORM_CONTROL.deposit} label={t('Deposit')} rules={[{ required: true }]}>
        <Select disabled size="large" value={t('Search deposit failed')} className="text-center"></Select>
      </Form.Item>
    );
  }

  if (!data || !data.list.length) {
    return (
      <Form.Item name={FORM_CONTROL.deposit} label={t('Deposit')} rules={[{ required: true }]}>
        <Select disabled size="large" value={t('No Deposits')} className="text-center"></Select>
      </Form.Item>
    );
  }

  return (
    <Form.Item name={FORM_CONTROL.deposit} label={t('Deposit')} rules={[{ required: true }, ...rules]}>
      <Select
        placeholder={t('Please select deposit')}
        value={value?.deposit_id}
        onChange={(id) => triggerChange(id)}
        size="large"
      >
        {data.list
          .filter((item) => !removedIds.includes(item.deposit_id))
          .map((item) => {
            const { deposit_id, amount } = item;
            const { start, end } = getDepositTimeRange(item);
            const DATE_FORMAT = 'yyyy/MM/dd';

            return (
              <Select.Option key={deposit_id} value={deposit_id}>
                <span>
                  {amount} RING
                  <span>
                    ({t('Deposit ID')}: {deposit_id} {t('Time')}: {format(start, DATE_FORMAT)} -{' '}
                    {format(end, DATE_FORMAT)})
                  </span>
                </span>
              </Select.Option>
            );
          })}
      </Select>
    </Form.Item>
  );
}
