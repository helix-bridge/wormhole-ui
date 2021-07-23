import { ArrowRightOutlined, DisconnectOutlined, LinkOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { isBoolean, negate } from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi, useNetworks } from '../hooks';
import { NetConfig, TransferValue } from '../model';
import { HashInfo, patchUrl, truth, isSameNetworkCurry } from '../utils';
import { updateStorage } from '../utils/helper/storage';
import { Destination } from './Destination';

export interface TransferControlProps {
  value?: TransferValue;
  onChange?: (value: TransferValue) => void;
}

export function TransferControl({ value, onChange }: TransferControlProps) {
  const { t } = useTranslation();
  const { setFromFilters, setToFilters, fromNetworks, toNetworks } = useNetworks();
  const { networkStatus } = useApi();
  const triggerChange = useCallback(
    (val: TransferValue) => {
      if (onChange) {
        onChange(val);
      }
    },
    [onChange]
  );

  useEffect(() => {
    const { from, to } = value || {};
    const isSameEnv =
      from?.isTest === to?.isTest
        ? isBoolean(from?.isTest) && isBoolean(to?.isTest)
          ? (net: NetConfig) => net.isTest === from?.isTest
          : truth
        : (net: NetConfig) => net.isTest === (isBoolean(from?.isTest) ? from?.isTest : to?.isTest);

    setToFilters([negate(isSameNetworkCurry(from)), isSameEnv]);
    setFromFilters([negate(isSameNetworkCurry(to)), isSameEnv]);
  }, [value, setFromFilters, setToFilters]);

  useEffect(() => {
    const { from, to } = value || {};
    const info = { from: from?.name ?? '', to: to?.name ?? '' } as HashInfo;

    patchUrl(info);
    updateStorage(info);
  }, [value]);

  return (
    <>
      <div className="flex sm:grid sm:grid-cols-5 justify-between items-center">
        <Destination
          networks={fromNetworks}
          title={t('From')}
          value={value?.from}
          extra={
            networkStatus === 'success' ? (
              <Tooltip title={t('Network connected')}>
                <LinkOutlined style={{ color: '#10b981' }} />
              </Tooltip>
            ) : (
              <Tooltip title={t('Network disconnected')}>
                <DisconnectOutlined style={{ color: '#ef4444' }} />
              </Tooltip>
            )
          }
          onChange={(from) => {
            triggerChange({ from, to: value?.to });
          }}
        />

        <ArrowRightOutlined className="mt-6 text-2xl" />

        <Destination
          title={t('To')}
          value={value?.to}
          networks={toNetworks}
          onChange={(to) => {
            triggerChange({ to, from: value?.from });
          }}
        />
      </div>

      {/* <SwitchWalletModal
        cancel={() => setIsWalletSwitcherVisible(false)}
        confirm={() => {
          switchAccountType(toOppositeAccountType(accountType));
          setAccount(null);
        }}
        isVisible={isWalletSwitcherVisible}
      /> */}
    </>
  );
}
