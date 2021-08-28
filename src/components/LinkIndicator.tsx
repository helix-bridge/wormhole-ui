import { DisconnectOutlined, LinkOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks';
import { NetConfig } from '../model';

interface LinkIndicatorProps {
  config: NetConfig | null;
  showSwitch?: boolean;
}

// eslint-disable-next-line complexity
export function LinkIndicator({ config, showSwitch }: LinkIndicatorProps) {
  const { t } = useTranslation();
  const { networkStatus, network, switchNetwork } = useApi();
  const existAndConsistent = config && config.name === network;

  if (networkStatus === 'connecting') {
    return <SyncOutlined spin style={{ color: '#1890ff' }} />;
  }

  if (networkStatus === 'success') {
    return (
      <Popover
        content={
          existAndConsistent ? (
            t('Network connected')
          ) : (
            <div className="max-w-sm flex flex-col">
              {config?.name && showSwitch ? (
                <>
                  <span>
                    {t(
                      'The connected network is not the same as the network selected, do you want switch to the {{network}} network?',
                      { network: config?.name }
                    )}
                  </span>
                  <Button
                    onClick={() => {
                      switchNetwork(config.name);
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
    );
  }

  return (
    <Tooltip title={t('Network disconnected')}>
      <DisconnectOutlined style={{ color: '#ef4444' }} />
    </Tooltip>
  );
}
