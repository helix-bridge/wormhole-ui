import { Affix, Empty, Input, message, Pagination, Select, Space, Spin, Tabs } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { EMPTY, map, Observable } from 'rxjs';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { NETWORK_CONFIG, NETWORK_GRAPH } from '../../config';
import {
  D2EHistoryRes,
  HistoryRouteParam,
  ListRes,
  Network,
  Paginator,
  RedeemHistory,
  RingBurnHistory,
} from '../../model';
import {
  getHistoryRouteParams,
  getNetworkCategory,
  isEthereumNetwork,
  isPolkadotNetwork,
  isValidAddress,
  queryD2ERecords,
  queryE2DRecords,
} from '../../utils';
import { D2ERecord } from './D2ERecord';
import { E2DRecord } from './E2DRecord';

const { TabPane } = Tabs;
const NETWORKS = [...NETWORK_GRAPH.keys()];

// eslint-disable-next-line complexity
export function Records() {
  const { t } = useTranslation();
  const inputRef = useRef<Input>(null);
  const { search } = useLocation<HistoryRouteParam>();
  const searchParams = useMemo(() => getHistoryRouteParams(search), [search]);
  const [network, setNetwork] = useState(searchParams.network);
  const [address, setAddress] = useState(searchParams.sender);
  const [paginator, setPaginator] = useState<Paginator>({ row: 10, page: 0 });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ListRes<unknown>>();
  const canUpdate = useCallback((addr: string | null, net: Network | null) => {
    if (addr && net) {
      const category = getNetworkCategory(net);

      return category && isValidAddress(addr, category);
    }

    return false;
  }, []);

  useDeepCompareEffect(() => {
    let obs: Observable<ListRes<unknown>> = EMPTY;

    if (isEthereumNetwork(network)) {
      obs = queryE2DRecords(network, address).pipe(map((list) => ({ list })));
    } else if (isPolkadotNetwork(network)) {
      obs = queryD2ERecords(network, address, paginator).pipe(map((res) => res || { list: [] }));
    } else {
      // tron
    }

    setLoading(true);
    setData(undefined);

    const subscription = obs.subscribe({
      next: (res) => {
        setData(res);
      },
      complete: () => setLoading(false),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [network, address, paginator]);

  return (
    <>
      <Affix offsetTop={0} target={() => document.getElementById('history-records')}>
        <Input.Group size="large" className="flex items-center w-full mb-8 select-search dark:bg-black">
          <Select
            size="large"
            defaultValue={searchParams?.network || NETWORKS[0]}
            className="capitalize"
            onSelect={(value) => {
              if (!canUpdate(address, value)) {
                setAddress('');
                inputRef.current?.setValue('');
              }

              setNetwork(value);
              setPaginator({ row: 10, page: 0 });
            }}
          >
            {NETWORKS.map((net) => {
              return (
                <Select.Option value={net} key={net} className="capitalize">
                  {net}
                </Select.Option>
              );
            })}
          </Select>

          <Input.Search
            defaultValue={searchParams?.sender || ''}
            loading={loading}
            ref={inputRef}
            onSearch={(value) => {
              if (canUpdate(value, network)) {
                setAddress(value);
              } else {
                message.error(t(`Invalid ${network} format address`));
              }
            }}
            enterButton="Search"
            size="large"
          />
        </Input.Group>
      </Affix>

      <Tabs defaultActiveKey={searchParams?.state || 'inprogress'}>
        <TabPane
          tab={
            <Space>
              <span>{t('In Progress')}</span>
              <span>{data?.count}</span>
            </Space>
          }
          key="inprogress"
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {isEthereumNetwork(network) &&
            ((data?.list || []) as (RingBurnHistory | RedeemHistory)[]).map((item) => (
              <E2DRecord record={item} network={NETWORK_CONFIG[network || 'ethereum']} key={item.block_timestamp} />
            ))}

          {isPolkadotNetwork(network) &&
            (data as D2EHistoryRes)?.list.map((item) => (
              <D2ERecord
                record={{
                  ...item,
                  meta: { MMRRoot: (data as D2EHistoryRes).MMRRoot, best: (data as D2EHistoryRes).best },
                }}
                network={NETWORK_CONFIG[network || 'darwinia']}
                key={item.block_timestamp}
              />
            ))}

          {loading && <Spin size="large" className="w-full" style={{ marginTop: 16 }} />}
          {(!data?.list || !data.list.length) && !loading && <Empty />}
        </TabPane>
        <TabPane
          tab={
            <Space>
              <span>{t('Confirmed Extrinsic')}</span>
              {/* <span></span> */}
            </Space>
          }
          key="confirmed"
        >
          <span>Coming soon ... Need api support</span>
        </TabPane>
      </Tabs>

      {data?.count && (
        <Pagination
          onChange={(page: number) => {
            setPaginator({ ...paginator, page: page - 1 });
          }}
          current={paginator.page + 1}
          pageSize={paginator.row}
          total={data.count}
          className="text-right fixed bottom-2 right-2 sm:right-16 lg:right-36"
        />
      )}
    </>
  );
}
