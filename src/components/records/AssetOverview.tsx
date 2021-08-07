import { Typography } from 'antd';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Unit } from 'web3-utils';
import { DATE_FORMAT } from '../../config';
import { fromWei, prettyNumber } from '../../utils';
import { getDepositTimeRange } from '../controls/DepositItem';

export interface AssetOverviewProps {
  amount: string;
  unit?: Unit;
  deposit?: { start: number; month: number; deposit_id: string };
  currency: string;
}

export function AssetOverview({ amount, deposit, currency, unit = 'ether' }: AssetOverviewProps) {
  const { t } = useTranslation();
  const depositFlag = 'DEPOSIT';

  if (!currency || !amount) {
    return null;
  }

  if (currency.toUpperCase() === depositFlag) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { deposit_id, start, month } = deposit!;
    const { start: startTime, end: endTime } = getDepositTimeRange({ deposit_time: start, duration: month });

    return (
      <Typography.Text>
        <span>{deposit_id}</span>
        <p>
          {fromWei({ value: amount }, prettyNumber)} RING ({t('Time')}: {format(startTime, DATE_FORMAT)} -{' '}
          {format(endTime, DATE_FORMAT)})
        </p>
      </Typography.Text>
    );
  }

  return (
    <Typography.Text className="mr-4">
      <span className="mr-2">{fromWei({ value: amount, unit }, prettyNumber)}</span>
      <span className="uppercase">{currency}</span>
    </Typography.Text>
  );
}
