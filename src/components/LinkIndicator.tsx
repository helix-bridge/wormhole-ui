import { DisconnectOutlined, LinkOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks';
import { EthereumConnection, NetConfig } from '../model';
import {
  getConfigByConnection,
  getDisplayName,
  isChainIdEqual,
  isEthereumNetwork,
  isPolkadotNetwork,
  isSameNetConfig,
} from '../utils';

interface LinkIndicatorProps {
  config: NetConfig | null;
  showSwitch?: boolean;
}

// eslint-disable-next-line complexity
export function LinkIndicator({ config, showSwitch }: LinkIndicatorProps) {
  const { t } = useTranslation();
  const { connection, network, setNetwork } = useApi();
  const [isConsistent, setIsConsistent] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState<NetConfig | null>(null);

  // eslint-disable-next-line complexity
  useEffect(() => {
    let is = !!config && isSameNetConfig(config, network);

    if (!is) {
      setIsConsistent(false);
      return;
    }

    if (config?.dvm || isEthereumNetwork(config?.name)) {
      is =
        connection.type === 'metamask' &&
        isChainIdEqual((connection as EthereumConnection).chainId, config!.ethereumChain.chainId);

      setIsConsistent(is);
    } else if (isPolkadotNetwork(config?.name)) {
      getConfigByConnection(connection).then((conf) => {
        is = connection.type === 'polkadot' && isSameNetConfig(config, conf);
        setIsConsistent(is);
      });
    } else {
      setIsConsistent(is);
    }
  }, [config, connection, network]);

  useEffect(() => {
    (async () => {
      const conf = await getConfigByConnection(connection);

      setConnectionConfig(conf);
    })();
  }, [connection]);

  if (connection.status === 'connecting') {
    return <SyncOutlined spin style={{ color: '#1890ff' }} />;
  }

  if (connection.status === 'success') {
    return (
      <Popover
        content={
          <div className="max-w-sm flex flex-col">
            {config?.name && showSwitch ? (
              <>
                <span>
                  {t(
                    'The connected network is not the same as the network selected, do you want switch to the {{network}} network?',
                    { network: getDisplayName(config) }
                  )}
                </span>
                <Button
                  onClick={() => {
                    setNetwork(config);
                  }}
                  className="self-end mt-2"
                >
                  {t('Switch')}
                </Button>
              </>
            ) : (
              <span>
                {t('The current network is connected to {{network}}', {
                  network: connectionConfig ? getDisplayName(connectionConfig) : '',
                })}
              </span>
            )}
          </div>
        }
      >
        <LinkOutlined style={{ color: isConsistent ? '#10b981' : '#fbbf24' }} />
      </Popover>
    );
  }

  return (
    <Tooltip title={t('Network disconnected')}>
      <DisconnectOutlined style={{ color: '#ef4444' }} />
    </Tooltip>
  );
}
