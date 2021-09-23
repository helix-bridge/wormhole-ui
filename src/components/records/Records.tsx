import { Affix, Empty, Input, message, Pagination, Radio, Select, Spin } from 'antd';
import { flow, uniqBy, upperFirst } from 'lodash';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { NETWORKS, NETWORK_CONFIG } from '../../config';
import {
  D2EHistory,
  D2EHistoryRes,
  HistoryReq,
  HistoryRouteParam,
  NetworkMode,
  Paginator,
  RedeemHistory,
  RingBurnHistory,
} from '../../model';
import {
  getDisplayName,
  getHistoryRouteParams,
  getNetConfigByVer,
  getNetworkCategory,
  getNetworkMode,
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

const DEPARTURES = uniqBy(
  NETWORKS.map((item) => ({
    name: getDisplayName(item),
    network: item.name,
    mode: getNetworkMode(item),
  })),
  'name'
);

// eslint-disable-next-line complexity
export function Records() {
  const { t } = useTranslation();
  const { search } = useLocation<HistoryRouteParam>();
  const searchParams = useMemo(() => getHistoryRouteParams(search), [search]);
  const [isGenesis, setIGenesis] = useState(false);
  const [network, setNetwork] = useState(searchParams.network || DEPARTURES[0].network);
  const [networkMode, setNetworkMode] = useState(searchParams.mode || DEPARTURES[0].mode);
  const [paginator, setPaginator] = useState<Paginator>({ row: 10, page: 0 });
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sourceData, setSourceData] = useState<{ count: number; list: any[] }>({ count: 0, list: [] });
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const canUpdate = useCallback((addr: string | null, net: string | null, mode: NetworkMode) => {
    if (addr && net) {
      if (mode === 'dvm') {
        return isValidAddress(addr, 'ethereum');
      } else {
        const category = flow([getVerticesFromDisplayName, getNetConfigByVer, getNetworkCategory])(net);

        return category && isValidAddress(addr, category);
      }
    }

    return false;
  }, []);
  const searchPlaceholder = useMemo(() => {
    if (isPolkadotNetwork(network)) {
      return networkMode === 'dvm'
        ? t('Please fill in a {{network}} smart address which start with 0x', { network: upperFirst(network) })
        : t('Please fill in a substrate address of the {{network}} network.', { network: upperFirst(network) });
    }

    if (isEthereumNetwork(network)) {
      return t('Please enter a valid {{network}} address', { network: 'Ethereum' });
    }

    return t('Please enter a valid {{network}} address', { network: upperFirst(network) });
  }, [network, networkMode, t]);

  const ele = useMemo(
    // eslint-disable-next-line complexity
    () => {
      let nodes: ReactElement[] | undefined = [];

      if (isEthereumNetwork(network) || isTronNetwork(network)) {
        nodes = ((sourceData.list || []) as (RingBurnHistory | RedeemHistory)[]).map((item, index) => (
          <E2DRecord
            record={item}
            network={NETWORK_CONFIG[network || 'ethereum']}
            key={item.block_timestamp || index}
          />
        ));
      } else if (isPolkadotNetwork(network)) {
        nodes = ((sourceData.list || []) as D2EHistory[]).map((item) => (
          <D2ERecord
            record={{
              ...item,
              meta: {
                MMRRoot: (sourceData as D2EHistoryRes).MMRRoot,
                best: (sourceData as D2EHistoryRes).best,
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
          {!sourceData.count && !loading && <Empty description={t('No Data')} />}
        </>
      );
    },
    [loading, network, sourceData, t]
  );

  // eslint-disable-next-line complexity
  useEffect(() => {
    if (!address || !canUpdate(address, network, networkMode)) {
      return;
    }

    const params: HistoryReq =
      confirmed === null
        ? {
            network,
            address,
            paginator,
          }
        : { network, address, paginator, confirmed };
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
        address: window.tronWeb ? window.tronWeb.address.toHex(params.address) : '',
      }).subscribe(observer);
    } else {
      setLoading(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [confirmed, address, canUpdate, network, networkMode, paginator, isGenesis]);

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
              const departure = DEPARTURES.find((item) => item.name.toLowerCase() === name.toLowerCase());

              setNetwork(departure!.network);
              setNetworkMode(departure!.mode);
              setPaginator({ row: 10, page: 0 });
              setSourceData({ list: [], count: 0 });
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
            onSearch={(value) => {
              if (canUpdate(value, network, networkMode)) {
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
