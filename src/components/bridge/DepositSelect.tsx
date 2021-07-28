import { Progress, Select, SelectProps } from 'antd';
import { addDays, format, getUnixTime } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { EvoApiPath } from '../../config';
import { useIAxios } from '../../hooks';
import { DepositResponse, NetConfig } from '../../model';
import { apiUrl } from '../../utils';

interface DepositSelectProps extends SelectProps<'single'> {
  address: string;
  config: NetConfig;
}

// eslint-disable-next-line complexity
export function DepositSelect({ address, config, ...others }: DepositSelectProps) {
  const { t } = useTranslation();
  const { data, error, loading } = useIAxios<DepositResponse>({
    url: apiUrl(config.api.evolution, EvoApiPath.deposit),
    // params: { address: '0xf916a4ef2de14a9d8aab6d29d122a641ecde2b28' }, // test account;
    params: { address },
    method: 'get',
  });

  if (loading) {
    return <Progress percent={99.9} status="active" strokeColor={{ from: '#5745de', to: '#ec3783' }} />;
  }

  if (!data || error) {
    return <Select {...others} disabled value={t('Search deposit failed')} className="text-center"></Select>;
  }

  if (!data || !data.list.length) {
    return <Select {...others} disabled value={t('No Deposits')} className="text-center"></Select>;
  }

  return (
    <Select placeholder={t('Please select deposit')} {...others}>
      {data.list.map((item) => {
        const { deposit_id, deposit_time, duration, amount } = item;
        const base = 30;
        const DATE_FORMAT = 'yyyy/MM/dd';
        const start = getUnixTime(new Date(deposit_time));
        const end = addDays(start, base * duration);

        return (
          <Select.Option key={deposit_id} value={deposit_id}>
            <span>
              {amount} RING
              <span>
                ({t('Deposit ID')}: {deposit_id} {t('Time')}: {format(start, DATE_FORMAT)} - {format(end, DATE_FORMAT)})
              </span>
            </span>
            ;
          </Select.Option>
        );
      })}
    </Select>
  );
}
