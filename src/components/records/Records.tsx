import { Affix, Empty, Input, message, Pagination, Select, Space, Spin, Tabs } from 'antd';
import { uniq } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { forkJoin, Subscription } from 'rxjs';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { NETWORKS, NETWORK_CONFIG } from '../../config';
import {
  D2EHistoryRes,
  HistoryRouteParam,
  Network,
  Paginator,
  RedeemHistory,
  RedeemHistoryRes,
  RingBurnHistory,
  RingBurnHistoryRes,
} from '../../model';
import {
  getHistoryRouteParams,
  getNetworkCategory,
  isEthereumNetwork,
  isPolkadotNetwork,
  isValidAddress,
  queryD2ERecords,
  queryE2DGenesisRecords,
  queryE2DRecords,
} from '../../utils';
import { D2ERecord } from './D2ERecord';
import { E2DRecord } from './E2DRecord';

const { TabPane } = Tabs;
const departures = uniq(NETWORKS.map((item) => item.name));

const count = (source: { count: number; list: unknown[] } | null) => source?.count || source?.list?.length || 0;

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
  const [lockData, setLockData] = useState<D2EHistoryRes | null>(null);
  const [genesisData, setGenesisData] = useState<RingBurnHistoryRes | null>(null);
  const [redeemData, setRedeemData] = useState<RedeemHistoryRes | null>(null);
  const [total, setTotal] = useState(0);
  const canUpdate = useCallback((addr: string | null, net: Network | null) => {
    if (addr && net) {
      const category = getNetworkCategory(net);

      return category && isValidAddress(addr, category);
    }

    return false;
  }, []);

  useDeepCompareEffect(() => {
    let subscription: Subscription;

    if (isEthereumNetwork(network)) {
      subscription = forkJoin([queryE2DRecords(network, address), queryE2DGenesisRecords(network, address)]).subscribe({
        next: (res) => {
          setRedeemData(res[0]);
          setGenesisData(res[1]);
        },
        complete: () => setLoading(false),
      });
    } else if (isPolkadotNetwork(network)) {
      subscription = queryD2ERecords(network, address, paginator).subscribe({
        next: (res) => {
          setLockData(res);
        },
        complete: () => setLoading(false),
      });
    } else {
      // do nothing
    }

    setLoading(true);

    return () => {
      subscription.unsubscribe();
    };
  }, [network, address, paginator]);

  useEffect(() => {
    if (isPolkadotNetwork(network)) {
      setTotal(count(lockData));
    } else {
      setTotal(count(redeemData) + count(genesisData));
    }
  }, [genesisData, lockData, network, redeemData]);

  return (
    <>
      <Affix offsetTop={63}>
        <Input.Group size="large" className="flex items-center w-full mb-8 select-search dark:bg-black">
          <Select
            size="large"
            defaultValue={searchParams?.network || departures[0]}
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
            {departures.map((net) => {
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
            enterButton={t('Search')}
            size="large"
          />
        </Input.Group>
      </Affix>

      <Spin spinning={loading} size="large">
        <Tabs defaultActiveKey={searchParams?.state || 'inprogress'}>
          <TabPane
            tab={
              <Space>
                <span>{t('In Progress')}</span>
                <span>{lockData?.count}</span>
              </Space>
            }
            key="inprogress"
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {isEthereumNetwork(network) &&
              ((redeemData?.list || []) as (RingBurnHistory | RedeemHistory)[]).map((item, index) => (
                <E2DRecord
                  record={item}
                  network={NETWORK_CONFIG[network || 'ethereum']}
                  key={item.block_timestamp || index}
                />
              ))}

            {isEthereumNetwork(network) &&
              genesisData?.list.map((item, index) => (
                <E2DRecord
                  record={item}
                  network={NETWORK_CONFIG[network || 'ethereum']}
                  key={item.block_timestamp || index}
                />
              ))}

            {isPolkadotNetwork(network) &&
              (lockData as D2EHistoryRes)?.list.map((item) => (
                <D2ERecord
                  record={{
                    ...item,
                    meta: { MMRRoot: (lockData as D2EHistoryRes).MMRRoot, best: (lockData as D2EHistoryRes).best },
                  }}
                  network={NETWORK_CONFIG[network || 'darwinia']}
                  key={item.block_timestamp}
                />
              ))}

            {!total && !loading && <Empty description={t('No Data')} />}
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
            <span>Coming Soon ... Need api support</span>
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
              total={total}
            />
          )}
        </div>
      </Spin>
    </>
  );
}
