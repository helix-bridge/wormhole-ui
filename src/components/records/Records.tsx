import { Affix, Empty, Input, message, Pagination, Radio, Select, Spin } from 'antd';
import { flow, isBoolean, negate, upperFirst } from 'lodash';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { EMPTY, Subscription } from 'rxjs';
import { NETWORK_CONFIG } from '../../config';
import { useNetworks } from '../../hooks';
import {
  D2EHistory,
  D2EHistoryRes,
  HistoryReq,
  HistoryRouteParam,
  NetConfig,
  Paginator,
  RedeemHistory,
  RingBurnHistory,
  Vertices,
} from '../../model';
import {
  getCrossChainArrivals,
  getDisplayName,
  getHistoryRouteParams,
  getNetConfigByVer,
  getNetworkCategory,
  getNetworkMode,
  getVerticesFromDisplayName,
  isEthereumNetwork,
  isPolkadotNetwork,
  isReachable,
  isSameNetworkCurry,
  isTronNetwork,
  isValidAddress,
  queryDarwinia2EthereumIssuingRecords,
  queryEthereum2DarwiniaGenesisRecords,
  queryEthereum2DarwiniaRedeemRecords,
} from '../../utils';
import { D2ERecord } from './D2ERecord';
import { E2DRecord } from './E2DRecord';

// eslint-disable-next-line complexity
export function Records() {
  const { t } = useTranslation();
  const { search } = useLocation<HistoryRouteParam>();
  const searchParams = useMemo(() => getHistoryRouteParams(search), [search]);
  const [isGenesis, setIGenesis] = useState(false);
  const { setToFilters, toNetworks, fromNetworks } = useNetworks(true);
  const [departure, setDeparture] = useState<Vertices>({
    network: searchParams.network || fromNetworks[0].name,
    mode: searchParams.mode || getNetworkMode(fromNetworks[0]),
  });
  const [paginator, setPaginator] = useState<Paginator>({ row: 10, page: 0 });
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sourceData, setSourceData] = useState<{ count: number; list: any[] }>({ count: 0, list: [] });
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [arrival, setArrival] = useState<Vertices>(() => {
    const config = getNetConfigByVer(departure);
    const data = getCrossChainArrivals(config!);

    return data[0];
  });
  const canUpdate = useCallback((addr: string | null, selected: Vertices) => {
    const { network, mode } = selected;

    if (addr && network) {
      if (mode === 'dvm') {
        return isValidAddress(addr, 'ethereum');
      } else {
        const category = flow([getVerticesFromDisplayName, getNetConfigByVer, getNetworkCategory])(network);

        return category && isValidAddress(addr, category);
      }
    }

    return false;
  }, []);
  const searchPlaceholder = useMemo(() => {
    const { network, mode } = departure;
    if (isPolkadotNetwork(network)) {
      return mode === 'dvm'
        ? t('Please fill in a {{network}} smart address which start with 0x', { network: upperFirst(network) })
        : t('Please fill in a substrate address of the {{network}} network.', { network: upperFirst(network) });
    }

    if (isEthereumNetwork(network)) {
      return t('Please enter a valid {{network}} address', { network: 'Ethereum' });
    }

    return t('Please enter a valid {{network}} address', { network: upperFirst(network) });
  }, [departure, t]);

  const ele = useMemo(
    // eslint-disable-next-line complexity
    () => {
      let nodes: ReactElement[] | undefined = [];
      const from = departure.network;
      const to = arrival.network;

      if ((isEthereumNetwork(from) && isPolkadotNetwork(to)) || isTronNetwork(from)) {
        // e2d & tron
        nodes = ((sourceData.list || []) as (RingBurnHistory | RedeemHistory)[]).map((item, index) => (
          <E2DRecord record={item} network={NETWORK_CONFIG[from || 'ethereum']} key={item.block_timestamp || index} />
        ));
      } else if (isPolkadotNetwork(from) && isEthereumNetwork(to)) {
        // d2e
        nodes = ((sourceData.list || []) as D2EHistory[]).map((item) => (
          <D2ERecord
            record={{
              ...item,
              meta: {
                MMRRoot: (sourceData as D2EHistoryRes).MMRRoot,
                best: (sourceData as D2EHistoryRes).best,
              },
            }}
            network={NETWORK_CONFIG[from || 'darwinia']}
            key={item.block_timestamp}
          />
        ));
      } else if (isPolkadotNetwork(from) && isPolkadotNetwork(to)) {
        // s2s
        nodes = [];
      } else {
        nodes = [];
      }

      return (
        <>
          {nodes}
          {!sourceData.count && !loading && <Empty description={t('No Data')} />}
        </>
      );
    },
    [departure.network, arrival.network, sourceData, loading, t]
  );

  // eslint-disable-next-line complexity
  useEffect(() => {
    if (!address || !canUpdate(address, departure)) {
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
    const observer = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (res: any) => {
        res = Array.isArray(res) ? { count: res.length, list: res } : res;
        setSourceData(res);
      },
      complete: () => setLoading(false),
    };
    let subscription: Subscription;

    setLoading(true);

    if (isEthereumNetwork(departure.network) && isPolkadotNetwork(arrival.network)) {
      if (isGenesis) {
        subscription = queryEthereum2DarwiniaGenesisRecords(params).subscribe(observer);
      } else {
        subscription = queryEthereum2DarwiniaRedeemRecords(params).subscribe(observer);
      }
    } else if (isPolkadotNetwork(departure.network) && isEthereumNetwork(arrival.network)) {
      subscription = queryDarwinia2EthereumIssuingRecords(params).subscribe(observer);
    } else if (isTronNetwork(departure.network)) {
      subscription = queryEthereum2DarwiniaGenesisRecords({
        ...params,
        address: window.tronWeb ? window.tronWeb.address.toHex(params.address) : '',
      }).subscribe(observer);
    } else if (isPolkadotNetwork(departure.network) && isPolkadotNetwork(arrival.network)) {
      subscription = EMPTY.subscribe(observer);
    } else {
      setLoading(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [confirmed, address, canUpdate, departure, paginator, isGenesis, arrival.network]);

  useEffect(() => {
    const target = fromNetworks.find(
      (item) => item.name.toLowerCase() === departure.network.toLowerCase()
    ) as NetConfig;
    const isSameEnv = (net: NetConfig) =>
      isBoolean(target.isTest) && isBoolean(net.isTest) ? net.isTest === target.isTest : true;

    setToFilters([negate(isSameNetworkCurry(target)), isSameEnv, isReachable(target, true)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const config = getNetConfigByVer(departure);
    const data = getCrossChainArrivals(config!);

    setArrival(data[0]);
  }, [departure]);

  return (
    <>
      <Affix offsetTop={63}>
        <Input.Group size="large" className="select-search flex items-center w-full mb-8dark:bg-black flex-1">
          <Select
            size="large"
            dropdownClassName="dropdown-networks"
            defaultValue={getDisplayName(fromNetworks[0])}
            className="capitalize"
            onSelect={(name: string) => {
              const target = fromNetworks.find(
                (item) => getDisplayName(item).toLowerCase() === name.toLowerCase()
              ) as NetConfig;
              const isSameEnv = (net: NetConfig) =>
                isBoolean(target.isTest) && isBoolean(net.isTest) ? net.isTest === target.isTest : true;

              setToFilters([negate(isSameNetworkCurry(target)), isSameEnv, isReachable(target, true)]);
              setDeparture({ network: target.name, mode: getNetworkMode(target) });
              setPaginator({ row: 10, page: 0 });
              setSourceData({ list: [], count: 0 });
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
              value={getDisplayName(getNetConfigByVer(arrival)!)}
              className="type-select capitalize"
              onSelect={(name: string) => {
                const target = toNetworks.find(
                  (item) => getDisplayName(item).toLowerCase() === name.toLowerCase()
                ) as NetConfig;

                setArrival({ network: target.name, mode: getNetworkMode(target) });
                setPaginator({ row: 10, page: 0 });
                setSourceData({ list: [], count: 0 });
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
                setSourceData({ list: [], count: 0 });
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
            onChange={(event) => setAddress(event.target.value)}
            onSearch={(value) => {
              if (canUpdate(value, departure)) {
                setAddress(value);
              } else {
                message.error(t(searchPlaceholder));
              }
            }}
            enterButton={t('Search')}
            size="large"
          />
        </Input.Group>
      </Affix>

      <Radio.Group
        onChange={(event) => {
          setConfirmed(event.target.value < 0 ? null : !!event.target.value);
        }}
        defaultValue={-1}
        size="large"
        className="my-4"
      >
        <Radio.Button value={-1}>{t('All')}</Radio.Button>
        <Radio.Button value={0}>{t('In Progress')}</Radio.Button>
        <Radio.Button value={1}>{t('Confirmed Extrinsic')}</Radio.Button>
      </Radio.Group>

      <Spin spinning={loading} size="large">
        {ele}

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
      </Spin>
    </>
  );
}
