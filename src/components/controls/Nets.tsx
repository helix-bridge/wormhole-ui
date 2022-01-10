import { ArrowDownOutlined, ArrowRightOutlined, ClearOutlined, DashOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { isBoolean, isNull, negate } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { airportsArrivalFilter, airportsDepartureFilter, useNetworks } from '../../hooks';
import { Arrival, BridgeStatus, ChainConfig, CustomFormControlProps, NullableCrossChainDirection } from '../../model';
import {
  getArrival,
  getBridge,
  getNetworkMode,
  HashInfo,
  isReachable,
  isSameNetworkCurry,
  isTraceable,
  patchUrl,
  truth,
} from '../../utils';
import { updateStorage } from '../../utils/helper/storage';
import { LinkIndicator } from '../LinkIndicator';
import { Destination, DestinationMode } from './Destination';

export type NetsProps = CustomFormControlProps<NullableCrossChainDirection>;

// eslint-disable-next-line complexity
export function Nets({
  value,
  onChange,
  isCross = true,
  mode = 'default',
}: NetsProps & { isCross?: boolean; mode?: DestinationMode }) {
  const { t } = useTranslation();
  const { setFromFilters, setToFilters, fromNetworks, toNetworks } = useNetworks(isCross);
  const [vertices, setVertices] = useState<Arrival | null>(null);
  const [reverseVertices, setReverseVertices] = useState<Arrival | null>(null);
  const [random, setRandom] = useState(0); // just for trigger animation when from and to reversed.
  const [bridgetStatus, setBridgetStatus] = useState<null | BridgeStatus>(null);

  const canReverse = useMemo(() => {
    const vers = [vertices, reverseVertices];

    return (vers.every(isNull) || vers.every(negate(isNull))) && !!value && (!!value.from || !!value.to);
  }, [reverseVertices, value, vertices]);

  const triggerChange = useCallback(
    (val: NullableCrossChainDirection) => {
      if (onChange) {
        onChange(val);
      }
    },
    [onChange]
  );

  const swap = useCallback(() => {
    triggerChange({
      from: value?.to ?? null,
      to: value?.from ?? null,
    });
    setRandom(Math.random());
  }, [triggerChange, value?.from, value?.to]);

  const Indicator = useMemo(() => (mode === 'default' ? RoadIndicatorLine : RoadIndicatorArrow), [mode]);

  // eslint-disable-next-line complexity
  useEffect(() => {
    const { from = null, to = null } = value || {};
    const isSameEnv =
      from?.isTest === to?.isTest
        ? isBoolean(from?.isTest) && isBoolean(to?.isTest)
          ? (net: ChainConfig) => net.isTest === from?.isTest
          : truth
        : (net: ChainConfig) => (isBoolean(from?.isTest) && isBoolean(to?.isTest) ? net.isTest === from?.isTest : true);
    const departureFilter = isCross ? [] : [airportsDepartureFilter];
    const arrivalFilter = isCross ? [] : [airportsArrivalFilter];

    setToFilters([negate(isSameNetworkCurry(from)), isSameEnv, isReachable(from, isCross), ...arrivalFilter]);
    setFromFilters([negate(isSameNetworkCurry(to)), isSameEnv, isTraceable(to, isCross), ...departureFilter]);
  }, [value, setFromFilters, setToFilters, isCross]);

  // eslint-disable-next-line complexity
  useEffect(() => {
    const { from, to } = value || {};
    const info = {
      from: from?.name ?? '',
      to: to?.name ?? '',
      fMode: from ? getNetworkMode(from) : 'native',
      tMode: to ? getNetworkMode(to) : 'native',
    } as HashInfo;
    const ver = getArrival(from, to);
    const reverseVer = getArrival(to, from);

    if (from && to) {
      const bridge = getBridge([from, to]);

      setBridgetStatus(bridge.status);
    } else {
      setBridgetStatus(null);
    }

    setVertices(ver);
    setReverseVertices(reverseVer);
    patchUrl(info);
    updateStorage(info);
  }, [value]);

  return (
    <div className={`relative flex justify-between items-center ${mode === 'default' ? 'flex-col' : ''}`}>
      <Destination
        networks={fromNetworks}
        title={t('From')}
        value={value?.from}
        extra={
          bridgetStatus !== 'pending' ? (
            <LinkIndicator config={value?.from ?? null} showSwitch={bridgetStatus === 'available'} />
          ) : (
            <></>
          )
        }
        onChange={(from) => {
          triggerChange({ from, to: value?.to ?? null });
        }}
        animationRandom={random}
        mode={mode}
        className="pr-4"
      />

      <Indicator canReverse={canReverse} onSwap={swap} status={bridgetStatus} />

      <Destination
        title={t('To')}
        value={value?.to}
        networks={toNetworks}
        onChange={(to) => {
          triggerChange({ to, from: value?.from ?? null });
        }}
        animationRandom={random}
        mode={mode}
        className="pr-4"
      />

      <Tooltip title={t('Reset Networks')}>
        <Button
          className="absolute -top-4 -right-4 flex items-center justify-center"
          onClick={() => triggerChange({ from: null, to: null })}
          type="link"
          icon={<ClearOutlined className="text-xl " />}
        ></Button>
      </Tooltip>
    </div>
  );
}

interface RoadIndicatorProps {
  status: BridgeStatus | null;
  canReverse?: boolean;
  onSwap: () => void;
}

function RoadIndicatorArrow({ status, canReverse, onSwap }: RoadIndicatorProps) {
  const { t } = useTranslation();
  return status === 'pending' ? (
    <Tooltip title={t('Coming Soon')}>
      <DashOutlined className="mt-6 mx-4 text-2xl" />
    </Tooltip>
  ) : (
    <>
      {canReverse ? (
        <Tooltip title={t('Swap from and to')}>
          <SwapOutlined onClick={onSwap} className="mt-6 mx-4 text-2xl" />
        </Tooltip>
      ) : (
        <ArrowRightOutlined className="mt-6 mx-4 text-2xl" />
      )}
    </>
  );
}

function RoadIndicatorLine({ canReverse, status, onSwap }: RoadIndicatorProps) {
  const element = useMemo(() => {
    if (status === 'pending') {
      return null;
    }

    return canReverse ? (
      <Button
        size="small"
        shape="circle"
        icon={<SwapOutlined className="transform rotate-90" />}
        onClick={onSwap}
        type="primary"
        className="flex items-center justify-center transform translate-x-1 translate-y-7"
      ></Button>
    ) : (
      <Button
        size="small"
        shape="circle"
        icon={<ArrowDownOutlined />}
        type="primary"
        className="flex items-center justify-center transform translate-x-1 translate-y-7"
      />
    );
  }, [canReverse, onSwap, status]);

  return (
    <div
      className={`absolute top-12 bottom-12 -right-1 border border-gray-300 dark:border-gray-600 border-l-0 w-4 rounded-r-md ${
        status === 'pending' ? 'border-dashed' : 'border-solid'
      }`}
    >
      {element}
    </div>
  );
}
