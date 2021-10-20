import { Empty, Pagination } from 'antd';
import { flow, omit } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY, Observable } from 'rxjs';
import { useS2SRecords } from '../../hooks';
import { HistoryReq, Paginator, Vertices } from '../../model';
import {
  getNetConfigByVer,
  getNetworkCategory,
  getVerticesFromDisplayName,
  isEthereumNetwork,
  isPolkadotNetwork,
  isTronNetwork,
  isValidAddress,
  queryDarwinia2EthereumIssuingRecords,
  queryEthereum2DarwiniaGenesisRecords,
  queryEthereum2DarwiniaRedeemRecords,
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
export const canQuery = (addr: string | null, departure: Vertices, arrival: Vertices) => {
  const { network, mode } = departure;

  if (addr && network) {
    if (mode === 'dvm') {
      return isEthereumNetwork(arrival.network)
        ? isValidAddress(addr, departure.network)
        : isValidAddress(addr, 'ethereum');
    } else {
      const category = flow([getVerticesFromDisplayName, getNetConfigByVer, getNetworkCategory])(network);

      return category && isValidAddress(addr, category === 'polkadot' ? network : category, true);
    }
  }

  return false;
};

// eslint-disable-next-line complexity
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
  const queryS2SRecords = useS2SRecords(getNetConfigByVer(departure)!);
  const updateLoading = useCallback(
    (isLoading: boolean) => {
      if (onLoading) {
        onLoading(isLoading);
        setLoading(isLoading);
      }
    },
    [onLoading]
  );

  // eslint-disable-next-line complexity
  useEffect(() => {
    if (!address || !canQuery(address, departure, arrival)) {
      setSourceData(SOURCE_DATA_DEFAULT);
      setPaginator(PAGINATOR_DEFAULT);
      return;
    }

    const params: HistoryReq =
      confirmed === null
        ? {
            network: departure.network,
            address,
            paginator,
          }
        : { network: departure.network, address, paginator, confirmed };
    let sourceObs: Observable<unknown> = EMPTY;

    updateLoading(true);

    if (isEthereumNetwork(departure.network) && isPolkadotNetwork(arrival.network)) {
      sourceObs = isGenesis
        ? queryEthereum2DarwiniaGenesisRecords(params)
        : queryEthereum2DarwiniaRedeemRecords(params);
    } else if (isPolkadotNetwork(departure.network) && isEthereumNetwork(arrival.network)) {
      sourceObs = queryDarwinia2EthereumIssuingRecords(params);
    } else if (isTronNetwork(departure.network)) {
      sourceObs = queryEthereum2DarwiniaGenesisRecords({
        ...params,
        address: window.tronWeb ? window.tronWeb.address.toHex(params.address) : '',
      });
    } else if (isPolkadotNetwork(departure.network) && isPolkadotNetwork(arrival.network)) {
      /**
       * @see https://github.com/graphprotocol/graph-node/issues/1309
       * TODO: At redeem side, subgraph does not support total count field in graphql response, limit and offset parameters are hardcoded.
       */
      sourceObs = queryS2SRecords({
        ...params,
        paginator: departure.mode === 'dvm' ? { row: 200, page: 0 } : paginator,
      });
    } else {
      //
    }

    const subscription = sourceObs.subscribe({
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
  }, [confirmed, address, departure, paginator, isGenesis, arrival, queryS2SRecords, updateLoading]);

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
