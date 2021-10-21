import { Empty, Pagination } from 'antd';
import { flow, omit } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecords } from '../../hooks';
import { Paginator, Vertices } from '../../model';
import {
  getNetConfigByVer,
  getNetworkCategory,
  getVerticesFromDisplayName,
  isEthereumNetwork,
  isReachable,
  isValidAddress,
} from '../../utils';
import { ErrorBoundary } from '../ErrorBoundary';
import { getRecord } from '../finder';

const PAGINATOR_DEFAULT = { row: 10, page: 0 };
const SOURCE_DATA_DEFAULT = { count: 0, list: [] };

interface RecordListProps {
  departure: Vertices;
  arrival: Vertices;
  address: string | null | undefined;
  confirmed: boolean | null;
  isGenesis?: boolean;
  onLoading?: (loading: boolean) => void;
}

// eslint-disable-next-line complexity
export const isAddressValid = (addr: string | null, departure: Vertices) => {
  const { network, mode } = departure;

  let addressValid = false;

  if (addr && network) {
    if (mode === 'dvm' || isEthereumNetwork(departure.network)) {
      addressValid = isValidAddress(addr, 'ethereum');
    } else {
      const category = flow([getVerticesFromDisplayName, getNetConfigByVer, getNetworkCategory])(network);

      addressValid = category && isValidAddress(addr, category === 'polkadot' ? network : category, true);
    }
  }

  return addressValid;
};

export function RecordList({ departure, arrival, address, confirmed, onLoading, isGenesis = false }: RecordListProps) {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sourceData, setSourceData] = useState<{ count: number; list: any[] }>(SOURCE_DATA_DEFAULT);
  const [paginator, setPaginator] = useState<Paginator>(PAGINATOR_DEFAULT);
  const [loading, setLoading] = useState(false);
  const Record = useMemo(
    () => getRecord({ from: getNetConfigByVer(departure), to: getNetConfigByVer(arrival) }),
    [departure, arrival]
  );
  const { queryRecords } = useRecords(departure, arrival);
  const updateLoading = useCallback(
    (isLoading: boolean) => {
      if (onLoading) {
        onLoading(isLoading);
        setLoading(isLoading);
      }
    },
    [onLoading]
  );

  useEffect(() => {
    if (
      !address ||
      !isAddressValid(address, departure) ||
      !isReachable(getNetConfigByVer(departure))(getNetConfigByVer(arrival))
    ) {
      setSourceData(SOURCE_DATA_DEFAULT);
      setPaginator(PAGINATOR_DEFAULT);
      return;
    }

    updateLoading(true);

    const subscription = queryRecords(
      { network: departure.network, address, paginator, confirmed },
      isGenesis
    ).subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (res: any) => {
        res = Array.isArray(res) ? { count: res.length, list: res } : res;
        setSourceData(res ?? SOURCE_DATA_DEFAULT);
      },
      error: () => updateLoading(false),
      complete: () => updateLoading(false),
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [address, arrival, confirmed, departure, isGenesis, paginator, queryRecords, updateLoading]);

  return (
    <ErrorBoundary>
      {sourceData.list.map((item, index) => (
        <Record
          record={{ ...item, meta: omit(sourceData, ['list', 'count']) }}
          departure={getNetConfigByVer(departure)}
          arrival={getNetConfigByVer(arrival)}
          key={item.block_timestamp || item.messageId || index}
        />
      ))}
      {!sourceData.count && !loading && <Empty description={t('No Data')} />}

      <div className="w-full max-w-6xl flex justify-center items-center mx-auto mt-4">
        {!!sourceData.count && (
          <Pagination
            onChange={(page: number) => {
              setPaginator({ ...paginator, page: page - 1 });
            }}
            current={paginator.page + 1}
            pageSize={paginator.row}
            total={sourceData.count ?? 0}
            showTotal={() => t('Total {{total}}', { total: sourceData.count })}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
