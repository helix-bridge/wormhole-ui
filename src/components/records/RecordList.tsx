import { Empty } from 'antd';
import { omit } from 'lodash';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Vertices } from '../../model';
import { verticesToChainConfig } from '../../utils';
import { ErrorBoundary } from '../ErrorBoundary';
import { getRecordComponent } from '../finder';

interface RecordListProps {
  departure: Vertices;
  arrival: Vertices;
  sourceData: { count: number; list: Record<string, string | number | null | undefined>[] };
}

export function RecordList({ departure, arrival, sourceData }: RecordListProps) {
  const { t } = useTranslation();
  const Record = useMemo(
    () => getRecordComponent({ from: verticesToChainConfig(departure), to: verticesToChainConfig(arrival) }),
    [departure, arrival]
  );

  return (
    <ErrorBoundary>
      {sourceData.list.map((item, index) => (
        <Record
          record={{ ...item, meta: omit(sourceData, ['list', 'count']) }}
          departure={verticesToChainConfig(departure)}
          arrival={verticesToChainConfig(arrival)}
          key={item.tx || index}
        />
      ))}
      {!sourceData.count && <Empty description={t('No Data')} />}
    </ErrorBoundary>
  );
}
