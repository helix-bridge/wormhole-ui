import { ArrowRightOutlined, ClearOutlined, DashOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { isBoolean, isNull, negate } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetworks } from '../../hooks';
import { Arrival, CustomFormControlProps, NetConfig, Network, TransferNetwork } from '../../model';
import {
  getConfigMode,
  getVertices,
  HashInfo,
  isReachable,
  isSameNetworkCurry,
  isTraceable,
  patchUrl,
  truth,
} from '../../utils';
import { updateStorage } from '../../utils/helper/storage';
import { LinkIndicator } from '../LinkIndicator';
import { Destination } from './Destination';

export type NetsProps = CustomFormControlProps<TransferNetwork>;

export function Nets({ value, onChange, isCross = true }: NetsProps & { isCross?: boolean }) {
  const { t } = useTranslation();
  const { setFromFilters, setToFilters, fromNetworks, toNetworks } = useNetworks(isCross);
  const [vertices, setVertices] = useState<Arrival | null>(null);
  const [reverseVertices, setReverseVertices] = useState<Arrival | null>(null);
  const [random, setRandom] = useState(0); // just for trigger animation when from and to reversed.

  const canReverse = useMemo(() => {
    const vers = [vertices, reverseVertices];

    return (vers.every(isNull) || vers.every(negate(isNull))) && !!value && (!!value.from || !!value.to);
  }, [reverseVertices, value, vertices]);

  const triggerChange = useCallback(
    (val: TransferNetwork) => {
      if (onChange) {
        onChange(val);
      }
    },
    [onChange]
  );

  useEffect(() => {
    const { from = null, to = null } = value || {};
    const isSameEnv =
      from?.isTest === to?.isTest
        ? isBoolean(from?.isTest) && isBoolean(to?.isTest)
          ? (net: NetConfig) => net.isTest === from?.isTest
          : truth
        : (net: NetConfig) => (isBoolean(from?.isTest) && isBoolean(to?.isTest) ? net.isTest === from?.isTest : true);

    setToFilters([negate(isSameNetworkCurry(from)), isSameEnv, isReachable(from, isCross)]);
    setFromFilters([negate(isSameNetworkCurry(to)), isSameEnv, isTraceable(to, isCross)]);
  }, [value, setFromFilters, setToFilters, isCross]);

  // eslint-disable-next-line complexity
  useEffect(() => {
    const { from, to } = value || {};
    const info = {
      from: from?.name ?? '',
      to: to?.name ?? '',
      fMode: from ? getConfigMode(from) : 'native',
      tMode: to ? getConfigMode(to) : 'native',
    } as HashInfo;
    const ver = getVertices(info.from as Network, info.to as Network);
    const reverseVer = getVertices(info.to as Network, info.from as Network);

    setVertices(ver);
    setReverseVertices(reverseVer);
    patchUrl(info);
    updateStorage(info);
  }, [value]);

  return (
    <div className="relative flex justify-between items-center">
      <Destination
        networks={fromNetworks}
        title={t('From')}
        value={value?.from}
        extra={
          vertices?.status !== 'pending' ? (
            <LinkIndicator config={value?.from ?? null} showSwitch={vertices?.status === 'available'} />
          ) : (
            <></>
          )
        }
        onChange={(from) => {
          triggerChange({ from, to: value?.to ?? null });
        }}
        animationRandom={random}
      />

      {vertices?.status === 'pending' ? (
        <Tooltip title={t('Coming Soon')}>
          <DashOutlined className="mt-6 mx-4 text-2xl" />
        </Tooltip>
      ) : (
        <>
          {canReverse ? (
            <Tooltip title={t('Swap from and to')}>
              <SwapOutlined
                onClick={() => {
                  triggerChange({
                    from: value?.to ?? null,
                    to: value?.from ?? null,
                  });
                  setRandom(Math.random());
                }}
                className="mt-6 mx-4 text-2xl"
              />
            </Tooltip>
          ) : (
            <ArrowRightOutlined className="mt-6 mx-4 text-2xl" />
          )}
        </>
      )}

      <Destination
        title={t('To')}
        value={value?.to}
        networks={toNetworks}
        onChange={(to) => {
          triggerChange({ to, from: value?.from ?? null });
        }}
        animationRandom={random}
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
