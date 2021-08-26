import {
  ArrowRightOutlined,
  ClearOutlined,
  DashOutlined,
  DisconnectOutlined,
  LinkOutlined,
  SwapOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';
import { isBoolean, isNull, negate } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Vertices } from '../../config';
import { useApi, useNetworks } from '../../hooks';
import { CustomFormControlProps, NetConfig, Network, TransferNetwork } from '../../model';
import {
  getNetworkByName,
  getVertices,
  HashInfo,
  isReachable,
  isSameNetworkCurry,
  isTraceable,
  patchUrl,
  truth,
} from '../../utils';
import { updateStorage } from '../../utils/helper/storage';
import { Destination } from './Destination';

export type NetsProps = CustomFormControlProps<TransferNetwork>;

export function Nets({ value, onChange, isCross = true }: NetsProps & { isCross?: boolean }) {
  const { t } = useTranslation();
  const { setFromFilters, setToFilters, fromNetworks, toNetworks } = useNetworks(isCross);
  const { networkStatus, network, switchNetwork } = useApi();
  const [vertices, setVertices] = useState<Vertices | null>(null);
  const [reverseVertices, setReverseVertices] = useState<Vertices | null>(null);
  const [random, setRandom] = useState(0); // just for trigger animation when from and to reversed.
  // eslint-disable-next-line complexity
  const Extra = useMemo(() => {
    if (networkStatus === 'connecting') {
      return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    }

    const existAndConsistent = value && value.from && value.from.name === network;

    return networkStatus === 'success' ? (
      <Popover
        content={
          existAndConsistent ? (
            t('Network connected')
          ) : (
            <div className="max-w-sm flex flex-col">
              {value?.from?.name && vertices?.status === 'available' ? (
                <>
                  <span>
                    {t(
                      'The connected network is not the same as the network selected, do you want switch to the {{network}} network?',
                      { network: value?.from?.name }
                    )}
                  </span>
                  <Button
                    onClick={() => {
                      switchNetwork(value!.from!.name);
                    }}
                    className="self-end mt-2"
                  >
                    {t('Switch')}
                  </Button>
                </>
              ) : (
                <span>{t('The current network is connected to {{network}}', { network })}</span>
              )}
            </div>
          )
        }
      >
        <LinkOutlined style={{ color: existAndConsistent ? '#10b981' : '#fbbf24' }} />
      </Popover>
    ) : (
      <Tooltip title={t('Network disconnected')}>
        <DisconnectOutlined style={{ color: '#ef4444' }} />
      </Tooltip>
    );
  }, [networkStatus, value, network, t, vertices?.status, switchNetwork]);

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

  useEffect(() => {
    const { from, to } = value || {};
    const info = { from: from?.name ?? '', to: to?.name ?? '' } as HashInfo;
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
        extra={vertices?.status !== 'pending' ? Extra : <></>}
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
                    from: getNetworkByName(value?.to?.name),
                    to: getNetworkByName(value?.from?.name),
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
