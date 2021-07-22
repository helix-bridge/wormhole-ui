import { ArrowRightOutlined, DisconnectOutlined, LinkOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { negate } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks';
import { NetConfig, TransferValue } from '../model';
import { getFromNetworks, getToNetworks, isSameNetwork } from '../utils';
import { Destination } from './Destination';

export interface TransferControlProps {
  value?: TransferValue;
  onChange?: (value: TransferValue) => void;
}

export function TransferControl({ value, onChange }: TransferControlProps) {
  console.info('🚀 ~ file: TransferControl.tsx ~ line 17 ~ TransferControl ~ value', value);
  const { t } = useTranslation();
  const [fromNetwork, setFromNetwork] = useState<NetConfig | undefined>();
  const [toNetwork, setToNetwork] = useState<NetConfig | undefined>();
  const [fromNetworks, setFromNetworks] = useState<NetConfig[]>(getFromNetworks([]));
  const [toNetworks, setToNetworks] = useState<NetConfig[]>(getToNetworks([]));
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
    const toFilters = fromNetwork ? [negate(isSameNetwork(fromNetwork))] : [];

    setToNetworks(getToNetworks(toFilters));
  }, [fromNetwork]);

  useEffect(() => {
    const fromFilters = toNetwork ? [negate(isSameNetwork(toNetwork))] : [];

    setFromNetworks(getFromNetworks(fromFilters));
  }, [toNetwork]);

  return (
    <>
      <div className="flex sm:grid sm:grid-cols-5 justify-between items-center">
        <Destination
          networks={fromNetworks}
          title={t('From')}
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
            setFromNetwork(from);
            triggerChange({ from, to: toNetwork });
          }}
        />

        <ArrowRightOutlined className="mt-6 text-2xl" />

        <Destination
          title={t('To')}
          networks={toNetworks}
          onChange={(to) => {
            setToNetwork(to);
            triggerChange({ to, from: fromNetwork });
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
