import { InfoCircleOutlined } from '@ant-design/icons';
import { Affix, Input, message, Pagination, Select, Spin, Tabs, Tooltip } from 'antd';
import { flow, isBoolean, negate, upperFirst } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { EMPTY, takeWhile } from 'rxjs';
import { useIsMounted, useNetworks, useRecords } from '../../hooks';
import { Arrival, ChainConfig, Departure, Paginator, Vertices } from '../../model';
import {
  getCrossChainArrivals,
  getDisplayName,
  getHistoryRouteParams,
  getNetworkCategory,
  getNetworkMode,
  getVerticesFromDisplayName,
  hasBridge,
  isChainConfigEqualTo,
  isDVM2Substrate,
  isEthereumNetwork,
  isPolkadotNetwork,
  isReachable,
  isSubstrateDVM,
  isValidAddressStrict,
  verticesToChainConfig,
} from '../../utils';
import { RecordList } from './RecordList';

const SOURCE_DATA_DEFAULT = { count: 0, list: [] };
const PAGINATOR_DEFAULT = { row: 10, page: 0 };

const defaultSelect: [Departure, Arrival] = [
  {
    network: 'darwinia',
    mode: 'native',
  },
  { network: 'crab', mode: 'dvm' },
];

// eslint-disable-next-line complexity
const isAddressValid = (addr: string | null, departure: Vertices) => {
  const { network, mode } = departure;

  let addressValid = false;

  if (addr && network) {
    if (mode === 'dvm' || isEthereumNetwork(departure.network)) {
      addressValid = isValidAddressStrict(addr, 'ethereum');
    } else {
      const category = flow([getVerticesFromDisplayName, verticesToChainConfig, getNetworkCategory])(network);

      addressValid = category && isValidAddressStrict(addr, category === 'polkadot' ? network : category);
    }
  }

  return addressValid;
};

// eslint-disable-next-line complexity
export function CrossChainRecord() {
  const { t } = useTranslation();
  const { search } = useLocation();
  const searchParams = useMemo(() => getHistoryRouteParams(search), [search]);
  const [isGenesis, setIGenesis] = useState(false);
  const { setToFilters, toNetworks, fromNetworks } = useNetworks();

  const [departure, setDeparture] = useState<Vertices>(() => {
    const { from: network, fMode: mode } = searchParams;

    return network && mode ? { network, mode } : defaultSelect[0];
  });

  const [arrival, setArrival] = useState<Vertices>(() => {
    const { to: network, tMode: mode } = searchParams;

    return network && mode ? { network, mode } : defaultSelect[1];
  });

  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const searchPlaceholder = useMemo(() => {
    const { network, mode } = departure;

    if (isPolkadotNetwork(network)) {
      return mode === 'dvm' && !isEthereumNetwork(arrival.network)
        ? t('Please fill in a {{network}} smart address which start with 0x', { network: upperFirst(network) })
        : t('Please fill in a substrate address of the {{network}} network.', { network: upperFirst(network) });
    }

    if (isEthereumNetwork(network)) {
      return t('Please enter a valid {{network}} address', { network: 'Ethereum' });
    }

    return t('Please enter a valid {{network}} address', { network: upperFirst(network) });
  }, [departure, arrival, t]);

  const [sourceData, setSourceData] =
    useState<{ count: number; list: Record<string, string | number | null | undefined>[] }>(SOURCE_DATA_DEFAULT);

  const { queryRecords } = useRecords(departure, arrival);
  const [paginator, setPaginator] = useState<Paginator>(PAGINATOR_DEFAULT);
  const isMounted = useIsMounted();

  const loadData = useCallback(
    (addr: string | null, confirm: boolean | null, dep: Vertices, arr: Vertices, isGen: boolean, pag: Paginator) => {
      if (!addr || !isAddressValid(addr, dep) || !isReachable(verticesToChainConfig(dep))(verticesToChainConfig(arr))) {
        setSourceData(SOURCE_DATA_DEFAULT);
        setPaginator(PAGINATOR_DEFAULT);

        return EMPTY.subscribe();
      }

      setLoading(true);

      return queryRecords({ direction: [dep, arr], address: addr, paginator: pag, confirmed: confirm }, isGen)
        .pipe(takeWhile(() => isMounted))
        .subscribe({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          next: (res: any) => {
            res = Array.isArray(res) ? { count: res.length, list: res } : res;
            setSourceData(res ?? SOURCE_DATA_DEFAULT);
          },
          error: () => setLoading(false),
          complete: () => setLoading(false),
        });
    },
    [isMounted, queryRecords]
  );

  useEffect(() => {
    const config = verticesToChainConfig(departure);
    const arrivals = getCrossChainArrivals(config!);

    setArrival(arrivals[0]);
  }, [departure]);

  useEffect(() => {
    const target = fromNetworks.find(
      (item) => item.name.toLowerCase() === departure.network.toLowerCase()
    ) as ChainConfig;
    const isSameEnv = (net: ChainConfig) =>
      isBoolean(target.isTest) && isBoolean(net.isTest) ? net.isTest === target.isTest : true;

    setToFilters([negate(isChainConfigEqualTo(target)), isSameEnv, isReachable(target)]);

    const { to, tMode } = searchParams;

    if (to && tMode) {
      setArrival({
        network: to,
        mode: tMode,
      });
    } else {
      const config = verticesToChainConfig(departure);
      const data = getCrossChainArrivals(config!);

      setArrival(data[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub$$ = loadData(address, confirmed, departure, arrival, isGenesis, paginator);

    return () => sub$$.unsubscribe();
  }, [address, arrival, confirmed, departure, isGenesis, loadData, paginator]);

  return (
    <>
      <Affix offsetTop={63}>
        <Input.Group size="large" className="select-search flex items-center w-full mb-8dark:bg-black flex-1">
          <Select
            size="large"
            dropdownClassName="dropdown-networks"
            value={getDisplayName(verticesToChainConfig(departure)!)}
            className="capitalize"
            onSelect={(name: string) => {
              const target = fromNetworks.find(
                (item) => getDisplayName(item).toLowerCase() === name.toLowerCase()
              ) as ChainConfig;

              const dep = { network: target.name, mode: getNetworkMode(target) };
              const reachable = hasBridge([dep, arrival]);

              const isSameEnv = (net: ChainConfig) =>
                isBoolean(target.isTest) && isBoolean(net.isTest) ? net.isTest === target.isTest : true;

              if (!reachable) {
                setArrival(getCrossChainArrivals(dep)[0]);
              }

              setToFilters([negate(isChainConfigEqualTo(target)), isSameEnv, isReachable(target)]);
              setDeparture(dep);
            }}
          >
            {fromNetworks.map((item) => {
              const name = getDisplayName(item);

              return (
                <Select.Option value={name} key={name} className="capitalize">
                  <span title={t('From')}>{name}</span>
                </Select.Option>
              );
            })}
          </Select>

          {departure && (
            <Select
              size="large"
              dropdownClassName="dropdown-networks"
              value={getDisplayName(verticesToChainConfig(arrival)!)}
              className="type-select capitalize"
              onSelect={(name: string) => {
                const target = toNetworks.find(
                  (item) => getDisplayName(item).toLowerCase() === name.toLowerCase()
                ) as ChainConfig;

                setArrival({ network: target.name, mode: getNetworkMode(target) });
              }}
            >
              {toNetworks.map((item) => {
                const name = getDisplayName(item);

                return (
                  <Select.Option value={name} key={name} className="capitalize">
                    <span title={t('To')}>{name}</span>
                  </Select.Option>
                );
              })}
            </Select>
          )}

          {isEthereumNetwork(departure.network) && (
            <Select
              value={Number(isGenesis)}
              size="large"
              onChange={(key) => {
                setIGenesis(!!key);
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
            placeholder={searchPlaceholder}
            disabled={isDVM2Substrate(departure, arrival)}
            onChange={(event) => {
              const value = event.target.value;
              if (
                !isAddressValid(value, departure) ||
                !isReachable(verticesToChainConfig(departure))(verticesToChainConfig(arrival))
              ) {
                return;
              }

              if (value === address) {
                loadData(address, confirmed, departure, arrival, isGenesis, paginator);
              } else {
                setAddress(value);
              }
            }}
            onSearch={(value) => {
              if (!isAddressValid(value, departure)) {
                message.error(t(searchPlaceholder));
              } else if (!isReachable(verticesToChainConfig(departure))(verticesToChainConfig(arrival))) {
                message.error(t('Origin network is not matched to the target network'));
              } else {
                if (value === address) {
                  loadData(address, confirmed, departure, arrival, isGenesis, paginator);
                } else {
                  setAddress(value);
                }
              }
            }}
            enterButton={t('Search')}
            size="large"
          />
        </Input.Group>
      </Affix>

      {!isSubstrateDVM(departure, arrival) ? (
        <Tabs
          type="card"
          onChange={(event) => {
            const num = Number(event);

            setConfirmed(num < 0 ? null : !!num);
          }}
          size="large"
          className="mt-4"
        >
          <Tabs.TabPane tab={t('All')} key="-1"></Tabs.TabPane>
          <Tabs.TabPane tab={t('In Progress')} key="0"></Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span className="flex items-center">
                {t('Confirmed Extrinsic')}
                <Tooltip
                  title={t(
                    'When the process is aborted or an error occurs, the token will be revert to the original account'
                  )}
                >
                  <InfoCircleOutlined className="ml-2" />
                </Tooltip>
              </span>
            }
            key="1"
          ></Tabs.TabPane>
        </Tabs>
      ) : (
        <div className="h-8 mt-4"></div>
      )}

      <Spin spinning={loading} size="large">
        <div className="bg-gray-200 dark:bg-antDark p-4 -mt-4">
          <RecordList departure={departure} arrival={arrival} sourceData={sourceData} />

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
        </div>
      </Spin>
    </>
  );
}
