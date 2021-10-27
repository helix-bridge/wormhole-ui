import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { Alert, AlertProps, Typography } from 'antd';
import React from 'react';
import { Trans } from 'react-i18next';
import { Tx } from '../model';

interface TxStatusProps extends Partial<AlertProps> {
  tx: Tx | null;
}

// eslint-disable-next-line complexity
const getAlertProps = (tx: Tx): AlertProps => {
  if (tx.status === 'signing') {
    return {
      type: 'info',
      message: <Trans>Waiting for approve, you need to approve this transaction in your wallet</Trans>,
      icon: <InfoCircleOutlined />,
    };
  }

  if (tx.status === 'broadcast') {
    return {
      type: 'info',
      message: <Trans>Has been broadcast, waiting for the node to receive</Trans>,
      icon: <SyncOutlined spin />,
    };
  }

  if (tx.status === 'queued') {
    return {
      type: 'info',
      message: <Trans>Has been added to the queue, waiting to be packaged</Trans>,
      icon: <SyncOutlined spin />,
    };
  }

  if (tx.status === 'inblock') {
    return { type: 'info', message: <Trans>The transaction has been packaged</Trans>, icon: <SyncOutlined spin /> };
  }

  if (tx.status === 'finalized') {
    return {
      type: 'success',
      message: (
        <div>
          <p>
            <Trans>
              The transaction has been sent, please check the transaction progress in the history or explorer.
            </Trans>
          </p>
          <Typography.Text copyable>{tx.hash}</Typography.Text>
        </div>
      ),
      icon: <CheckCircleOutlined />,
    };
  }

  if (tx.status === 'error') {
    return { type: 'error', message: tx.error, icon: <CloseCircleOutlined /> };
  }

  return {
    type: 'info',
    message: 'Processing',
    icon: <InfoCircleOutlined />,
  };
};

export function TxStatus({ tx, ...others }: TxStatusProps) {
  if (!tx) {
    return null;
  }

  const { type, message, icon } = getAlertProps(tx);

  return (
    <Alert
      {...others}
      className="flex fixed top-20 right-8 border-none max-w-sm"
      message={message}
      icon={icon}
      type={type}
      showIcon
      style={{ zIndex: 999999 }}
      closable={type === 'success' || type === 'error'}
    />
  );
}
