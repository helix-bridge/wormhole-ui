import { ArrowRightOutlined, DashOutlined, DisconnectOutlined, LinkOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';
import { isBoolean, negate } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Vertices } from '../../config';
import { useApi, useNetworks } from '../../hooks';
import { CustomFormControlProps, NetConfig, Network, TransferNetwork } from '../../model';
import { getVertices, HashInfo, isReachable, isSameNetworkCurry, isTraceable, patchUrl, truth } from '../../utils';
import { updateStorage } from '../../utils/helper/storage';
import { Destination } from './Destination';

export type NetsProps = CustomFormControlProps<TransferNetwork>;

export function Nets({ value, onChange }: NetsProps) {
  const { t } = useTranslation();
  const { setFromFilters, setToFilters, fromNetworks, toNetworks } = useNetworks();
  const { networkStatus, network, switchNetwork } = useApi();
  const [vertices, setVertices] = useState<Vertices | null>(null);
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
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

    setToFilters([negate(isSameNetworkCurry(from)), isSameEnv, isReachable(from)]);
    setFromFilters([negate(isSameNetworkCurry(to)), isSameEnv, isTraceable(to)]);
  }, [value, setFromFilters, setToFilters]);

  useEffect(() => {
    const { from, to } = value || {};
    const info = { from: from?.name ?? '', to: to?.name ?? '' } as HashInfo;
    const ver = getVertices(info.from as Network, info.to as Network);

    setVertices(ver);
    patchUrl(info);
    updateStorage(info);
  }, [value]);

  return (
    <div className="flex sm:grid sm:grid-cols-5 justify-between items-center">
      <Destination
        networks={fromNetworks}
        title={t('From')}
        value={value?.from}
        extra={vertices?.status !== 'pending' ? Extra : <></>}
        onChange={(from) => {
          triggerChange({ from, to: value?.to ?? null });
        }}
      />

      {vertices?.status === 'pending' ? (
        <Tooltip title={t('Coming Soon')}>
          <DashOutlined className="mt-6 text-2xl" />
        </Tooltip>
      ) : (
        <ArrowRightOutlined className="mt-6 text-2xl" />
      )}

      <Destination
        title={t('To')}
        value={value?.to}
        networks={toNetworks}
        onChange={(to) => {
          triggerChange({ to, from: value?.from ?? null });
        }}
      />
    </div>
  );
}
