import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { Alert, AlertProps } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tx } from '../model';

interface TxStatusProps extends Partial<AlertProps> {
  tx: Tx | null;
}

// eslint-disable-next-line complexity
const getAlertProps = (tx: Tx): AlertProps => {
  if (tx.status === 'signing') {
    return { type: 'info', message: 'Wait for approve', icon: <InfoCircleOutlined /> };
  }

  if (tx.status === 'broadcast') {
    return { type: 'info', message: 'Broadcasted, waiting process', icon: <SyncOutlined spin /> };
  }

  if (tx.status === 'queued') {
    return { type: 'info', message: 'Queue, waiting process', icon: <SyncOutlined spin /> };
  }

  if (tx.status === 'inblock') {
    return { type: 'info', message: 'Transfer has been packaged', icon: <SyncOutlined spin /> };
  }

  if (tx.status === 'finalized') {
    return { type: 'success', message: 'Transaction success {{hash}}', icon: <CheckCircleOutlined /> };
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
  const { t } = useTranslation();

  if (!tx) {
    return null;
  }

  const { type, message, icon } = getAlertProps(tx);

  return (
    <Alert
      {...others}
      className="flex fixed top-20 right-8 border-none max-w-sm"
      message={t(message as string, { hash: tx.hash ?? '' })}
      icon={icon}
      type={type}
      showIcon
      style={{ zIndex: 999999 }}
      closable={type === 'success' || type === 'error'}
    />
  );
}
