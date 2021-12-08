import { Empty } from 'antd';
import { omit } from 'lodash';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Vertices } from '../../model';
import { verticesToNetConfig } from '../../utils';
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
    () => getRecordComponent({ from: verticesToNetConfig(departure), to: verticesToNetConfig(arrival) }),
    [departure, arrival]
  );

  return (
    <ErrorBoundary>
      {sourceData.list.map((item, index) => (
        <Record
          record={{ ...item, meta: omit(sourceData, ['list', 'count']) }}
          departure={verticesToNetConfig(departure)}
          arrival={verticesToNetConfig(arrival)}
          key={item.tx || index}
        />
      ))}
      {!sourceData.count && <Empty description={t('No Data')} />}
    </ErrorBoundary>
  );
}
