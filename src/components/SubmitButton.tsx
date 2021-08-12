import { Button, ButtonProps, Form } from 'antd';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi, useTx } from '../hooks';
import { NetConfig, ConnectStatus } from '../model';
import { hasBridge, isBridgeAvailable, isPolkadotNetwork } from '../utils';

interface SubmitButtonProps extends ButtonProps {
  from: NetConfig | null;
  to: NetConfig | null;
  requireTo?: boolean;
}

export function FromItemButton({ children, className, ...others }: ButtonProps) {
  return (
    <Form.Item className="mt-8">
      <Button
        type="primary"
        size="large"
        {...others}
        className={`ax-auto w-full rounded-xl text-white flex items-center uppercase ${className} `}
      >
        <span className="whitespace-nowrap overflow-hidden overflow-ellipsis w-full">{children}</span>
      </Button>
    </Form.Item>
  );
}

// eslint-disable-next-line complexity
export function SubmitButton({ from, to, children, requireTo, disabled }: PropsWithChildren<SubmitButtonProps>) {
  const { t } = useTranslation();
  const { networkStatus, network, switchNetwork, connectToEth, connectToSubstrate } = useApi();
  const { tx } = useTx();
  const errorConnections: ConnectStatus[] = ['pending', 'disconnected', 'fail'];

  if (tx) {
    return <FromItemButton disabled>{t(tx.status)}</FromItemButton>;
  }

  if (from?.name && to?.name && hasBridge(from.name, to.name) && !isBridgeAvailable(from.name, to.name)) {
    return <FromItemButton disabled>{t('Coming Soon')}</FromItemButton>;
  }

  if (networkStatus === 'connecting') {
    return <FromItemButton disabled>{t('Connecting ...')}</FromItemButton>;
  }

  if (networkStatus === 'success' && from && from.name !== network) {
    return (
      <FromItemButton onClick={() => switchNetwork(from.name)}>
        {t('Switch to {{network}}', { network: from.name })}
      </FromItemButton>
    );
  }

  if (errorConnections.includes(networkStatus) && !!from?.name) {
    return (
      <FromItemButton
        onClick={() => {
          if (network !== from.name) {
            switchNetwork(from.name);

            return;
          }

          const isPolkadot = isPolkadotNetwork(from.name);

          if (isPolkadot) {
            connectToSubstrate(network);
          } else {
            connectToEth(network);
          }
        }}
      >
        {t('Connect to {{network}}', { network: from.name })}
      </FromItemButton>
    );
  }

  if ((networkStatus === 'success' && !from?.name) || networkStatus === 'pending') {
    return null;
  }

  return (
    <FromItemButton disabled={(!!requireTo && !to) || disabled} htmlType="submit">
      {children || t('Submit')}
    </FromItemButton>
  );
}
