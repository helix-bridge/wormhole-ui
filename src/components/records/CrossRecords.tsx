import { InfoCircleOutlined } from '@ant-design/icons';
import { Affix, Input, message, Select, Spin, Tabs, Tooltip } from 'antd';
import { isBoolean, negate, upperFirst } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useNetworks } from '../../hooks';
import { ChainConfig, HistoryRouteParam, Vertices } from '../../model';
import {
  getCrossChainArrivals,
  getDisplayName,
  getHistoryRouteParams,
  getNetworkMode,
  isEthereumNetwork,
  isPolkadotNetwork,
  isReachable,
  isSameNetworkCurry,
  verticesToNetConfig,
} from '../../utils';
import { isAddressValid, RecordList } from './RecordList';

// eslint-disable-next-line complexity
export function CrossRecords() {
  const { t } = useTranslation();
  const { search } = useLocation<HistoryRouteParam>();
  const searchParams = useMemo(() => getHistoryRouteParams(search), [search]);
  const [isGenesis, setIGenesis] = useState(false);
  const { setToFilters, toNetworks, fromNetworks } = useNetworks(true);
  const [departure, setDeparture] = useState<Vertices>({
    network: searchParams.from || fromNetworks[0].name,
    mode: searchParams.fMode || getNetworkMode(fromNetworks[0]),
  });
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [arrival, setArrival] = useState<Vertices>({
    network: searchParams.to || toNetworks[0].name,
    mode: searchParams.tMode || getNetworkMode(toNetworks[0]),
  });
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

  useEffect(() => {
    const config = verticesToNetConfig(departure);
    const arrivals = getCrossChainArrivals(config!);

    setArrival(arrivals[0]);
  }, [departure]);

  useEffect(() => {
    const target = fromNetworks.find(
      (item) => item.name.toLowerCase() === departure.network.toLowerCase()
    ) as ChainConfig;
    const isSameEnv = (net: ChainConfig) =>
      isBoolean(target.isTest) && isBoolean(net.isTest) ? net.isTest === target.isTest : true;

    setToFilters([negate(isSameNetworkCurry(target)), isSameEnv, isReachable(target, true)]);

    const { to, tMode } = searchParams;

    if (to && tMode) {
      setArrival({
        network: to,
        mode: tMode,
      });
    } else {
      const config = verticesToNetConfig(departure);
      const data = getCrossChainArrivals(config!);

      setArrival(data[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Affix offsetTop={63}>
        <Input.Group size="large" className="select-search flex items-center w-full mb-8dark:bg-black flex-1">
          <Select
            size="large"
            dropdownClassName="dropdown-networks"
            value={getDisplayName(verticesToNetConfig(departure)!)}
            className="capitalize"
            onSelect={(name: string) => {
              const target = fromNetworks.find(
                (item) => getDisplayName(item).toLowerCase() === name.toLowerCase()
              ) as ChainConfig;
              const isSameEnv = (net: ChainConfig) =>
                isBoolean(target.isTest) && isBoolean(net.isTest) ? net.isTest === target.isTest : true;

              setToFilters([negate(isSameNetworkCurry(target)), isSameEnv, isReachable(target, true)]);
              setDeparture({ network: target.name, mode: getNetworkMode(target) });
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
              value={getDisplayName(verticesToNetConfig(arrival)!)}
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
            onChange={(event) => setAddress(event.target.value)}
            onSearch={(value) => {
              if (!isAddressValid(value, departure)) {
                message.error(t(searchPlaceholder));
              } else if (!isReachable(verticesToNetConfig(departure))(verticesToNetConfig(arrival))) {
                message.error(t('Origin network is not matched to the target network'));
              } else {
                setAddress(value);
              }
            }}
            enterButton={t('Search')}
            size="large"
          />
        </Input.Group>
      </Affix>

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

      <Spin spinning={loading} size="large">
        <div className="bg-gray-200 dark:bg-antDark p-4 -mt-4">
          <RecordList
            departure={departure}
            arrival={arrival}
            isGenesis={isGenesis}
            confirmed={confirmed}
            address={address}
            onLoading={setLoading}
          />
        </div>
      </Spin>
    </>
  );
}
