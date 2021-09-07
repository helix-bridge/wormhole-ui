import { Affix, Empty, Input, message, Pagination, Select, Space, Spin, Tabs } from 'antd';
import { flow, uniqBy } from 'lodash';
import { ReactElement, useCallback, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { NETWORKS, NETWORK_CONFIG } from '../../config';
import {
  Action,
  D2EHistory,
  D2EHistoryRes,
  HistoryReq,
  HistoryRouteParam,
  Network,
  Paginator,
  RedeemHistory,
  RingBurnHistory,
} from '../../model';
import {
  getDisplayName,
  getHistoryRouteParams,
  getNetConfigByVer,
  getNetworkCategory,
  getVerticesFromDisplayName,
  isEthereumNetwork,
  isPolkadotNetwork,
  isTronNetwork,
  isValidAddress,
  queryD2ERecords,
  queryE2DGenesisRecords,
  queryE2DRecords,
} from '../../utils';
import { D2ERecord } from './D2ERecord';
import { E2DRecord } from './E2DRecord';

type HistoryData<T> = { [key in HistoryRouteParam['state']]: T | null };

const { TabPane } = Tabs;
const TRON_DEPARTURE: { name: string; network: Network } = { name: NETWORK_CONFIG.tron.fullName, network: 'tron' };
const DEPARTURES = uniqBy(
  NETWORKS.map((item) => ({
    name: getDisplayName(item),
    network: item.name,
  })),
  'name'
).concat([TRON_DEPARTURE]);

const count = (source: { count: number; list: unknown[] } | null) => source?.count || source?.list?.length || 0;
const totalInitialState = {
  inprogress: null,
  completed: null,
};

function totalReducer(state: HistoryData<number>, action: Action<HistoryRouteParam['state'] | 'reset', number | null>) {
  if (action.type === 'reset') {
    return totalInitialState;
  }

  return { ...state, [action.type]: action.payload };
}

// eslint-disable-next-line complexity
export function Records() {
  const { t } = useTranslation();
  const { search } = useLocation<HistoryRouteParam>();
  const searchParams = useMemo(() => getHistoryRouteParams(search), [search]);
  const [isGenesis, setIGenesis] = useState(false);
  const [network, setNetwork] = useState(searchParams.network || DEPARTURES[0].network);
  const [paginator, setPaginator] = useState<Paginator>({ row: 10, page: 0 });
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sourceData, setSourceData] = useState<HistoryData<any>>({ completed: null, inprogress: null });
  const [total, setTotal] = useReducer(totalReducer, totalInitialState);
  const [activeKey, setActiveKey] = useState<HistoryRouteParam['state']>(searchParams.state ?? 'inprogress');
  const canUpdate = useCallback((addr: string | null, net: string | null) => {
    if (addr && net) {
      const category = flow([getVerticesFromDisplayName, getNetConfigByVer, getNetworkCategory])(net);

      return category && isValidAddress(addr, category);
    }

    return false;
  }, []);

  const ele = useCallback(
    // eslint-disable-next-line complexity
    (key: HistoryRouteParam['state']) => {
      let nodes: ReactElement[] | undefined = [];

      if (isEthereumNetwork(network) || isTronNetwork(network)) {
        nodes = ((sourceData[key]?.list || []) as (RingBurnHistory | RedeemHistory)[]).map((item, index) => (
          <E2DRecord
            record={item}
            network={NETWORK_CONFIG[network || 'ethereum']}
            key={item.block_timestamp || index}
          />
        ));
      } else if (isPolkadotNetwork(network)) {
        nodes = ((sourceData[key]?.list || []) as D2EHistory[]).map((item) => (
          <D2ERecord
            record={{
              ...item,
              meta: {
                MMRRoot: (sourceData[key] as D2EHistoryRes).MMRRoot,
                best: (sourceData[key] as D2EHistoryRes).best,
              },
            }}
            network={NETWORK_CONFIG[network || 'darwinia']}
            key={item.block_timestamp}
          />
        ));
      } else {
        nodes = [];
      }

      return (
        <>
          {nodes}
          {!total[activeKey] && !loading && <Empty description={t('No Data')} />}
        </>
      );
    },
    [activeKey, loading, network, sourceData, t, total]
  );

  const queryRecords = useCallback(
    // eslint-disable-next-line complexity
    (addr: string) => {
      const params: HistoryReq = {
        network,
        address: addr,
        paginator,
        confirmed: activeKey === 'completed',
      };
      const observer = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: (res: any) => {
          res = Array.isArray(res) ? { count: res.length, list: res } : res;
          setSourceData({ ...sourceData, [activeKey]: res });
          setTotal({ type: activeKey, payload: count(res) });
        },
        complete: () => setLoading(false),
      };
      let subscription: Subscription;

      setLoading(true);

      if (isEthereumNetwork(network)) {
        if (isGenesis) {
          subscription = queryE2DGenesisRecords(params).subscribe(observer);
        } else {
          subscription = queryE2DRecords(params).subscribe(observer);
        }
      } else if (isPolkadotNetwork(network)) {
        subscription = queryD2ERecords(params).subscribe(observer);
      } else if (isTronNetwork(network)) {
        subscription = queryE2DGenesisRecords({
          ...params,
          address: window.tronWeb ? window.tronWeb.address.toHex(addr) : '',
        }).subscribe(observer);
      } else {
        setLoading(false);
      }

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    },
    [network, paginator, activeKey, sourceData, isGenesis]
  );

  return (
    <>
      <Affix offsetTop={63}>
        <Input.Group size="large" className="select-search flex items-center w-full mb-8dark:bg-black">
          <Select
            size="large"
            dropdownClassName="dropdown-networks"
            defaultValue={searchParams?.network || DEPARTURES[0].network}
            className="capitalize"
            onSelect={(name: string) => {
              const departure = DEPARTURES.find((item) => item.name.toLowerCase() === name.toLowerCase())!.network;

              setNetwork(departure);
              setPaginator({ row: 10, page: 0 });
              setTotal({ type: 'reset', payload: 0 });
              setSourceData({ inprogress: null, completed: null });
            }}
          >
            {DEPARTURES.map(({ name }) => (
              <Select.Option value={name} key={name} className="capitalize">
                {name}
              </Select.Option>
            ))}
          </Select>

          {isEthereumNetwork(network) && (
            <Select
              value={Number(isGenesis)}
              size="large"
              onChange={(key) => {
                setIGenesis(!!key);
                setTotal({ type: 'reset', payload: 0 });
                setSourceData({ inprogress: null, completed: null });
              }}
              className="type-select capitalize"
            >
              <Select.Option value={0} key={0}>
                {t('Normal')}
              </Select.Option>
              <Select.Option value={1} key={1}>
                {t('Genesis')}
              </Select.Option>
            </Select>
          )}

          <Input.Search
            defaultValue={searchParams?.sender || ''}
            loading={loading}
            // ref={inputRef}
            onSearch={(value) => {
              if (canUpdate(value, network)) {
                // setAddress(value);
                queryRecords(value);
              } else {
                message.error(t(`Invalid ${network} format address`));
              }
            }}
            enterButton={t('Search')}
            size="large"
          />
        </Input.Group>
      </Affix>

      <Spin spinning={loading} size="large">
        <Tabs defaultActiveKey={activeKey} onChange={(key) => setActiveKey(key as HistoryRouteParam['state'])}>
          <TabPane
            tab={
              <Space>
                <span>{t('In Progress')}</span>
                <span>{total['inprogress']}</span>
              </Space>
            }
            key="inprogress"
          >
            {ele('inprogress')}
          </TabPane>

          <TabPane
            tab={
              <Space>
                <span>{t('Confirmed Extrinsic')}</span>
                <span>{total['completed']}</span>
              </Space>
            }
            key="completed"
          >
            {ele('completed')}
          </TabPane>
        </Tabs>

        <div className="w-full max-w-6xl flex justify-center items-center mx-auto mt-4">
          {!!total && (
            <Pagination
              onChange={(page: number) => {
                setPaginator({ ...paginator, page: page - 1 });
              }}
              current={paginator.page + 1}
              pageSize={paginator.row}
              total={total[activeKey] ?? 0}
            />
          )}
        </div>
      </Spin>
    </>
  );
}
