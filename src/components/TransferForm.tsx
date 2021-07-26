import { LockOutlined } from '@ant-design/icons';
import { Button, ButtonProps, Form, Input, Select } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { validateMessages } from '../config';
import { useApi } from '../hooks';
import { ConnectStatus, NetConfig, Network, TransferFormValues, TransferValue } from '../model';
import { getInitialSetting, getNetworkByName, getVertices } from '../utils';
import { Balance } from './Balance';
import { DownIcon } from './icons';
import { TransferControl } from './TransferControl';

const initTransfer: () => TransferValue = () => {
  const come = getInitialSetting('from', '') as Network;
  const go = getInitialSetting('to', '') as Network;
  const from = getNetworkByName(come);
  const to = getNetworkByName(go);

  if (from?.isTest === to?.isTest) {
    return { from, to };
  } else if (from) {
    return { from, to: null };
  } else {
    return { from: null, to };
  }
};
const TRANSFER = initTransfer();

export function TransferForm() {
  const { t, i18n } = useTranslation();
  const [form] = useForm<TransferFormValues>();
  const { network, networkStatus } = useApi();
  const [transfer, setTransfer] = useState(TRANSFER);
  const [isFromReady, setIsFromReady] = useState(false);
  const [isToReady, setIsToReady] = useState(false);
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  // eslint-disable-next-line complexity
  useEffect(() => {
    const { from, to } = transfer;
    const isReady = !!from && from.name === network && networkStatus === 'success';
    const vertices = getVertices((from?.name ?? '') as Network, (to?.name ?? '') as Network);
    const hasBridge = !!vertices && vertices.status === 'available';

    setIsToReady(!!to);
    setIsFromReady(isReady);
    setIsBridgeReady(hasBridge || !from?.name || !to?.name);
  }, [network, networkStatus, transfer]);

  return (
    <>
      <Form
        name="transfer"
        layout="vertical"
        form={form}
        initialValues={{
          recipient: '',
          assets: 'ring',
          amount: '',
          transfer: TRANSFER,
        }}
        onFinish={(value) => {
          console.info('🚀 ~ file: TransferForm.tsx ~ line 71 ~ TransferForm ~ value', value);
        }}
        validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
      >
        <Form.Item
          name="transfer"
          rules={[
            { required: true, message: t('Both send and receive network are all required') },
            {
              validator: (_, value: TransferValue) => {
                return value.from && value.to ? Promise.resolve() : Promise.reject();
              },
              message: t('You maybe forgot to select receive or sender network'),
            },
          ]}
        >
          <TransferControl
            onChange={(value) => {
              setTransfer(value);
            }}
          />
        </Form.Item>

        {isFromReady && isBridgeReady && (
          <>
            <Form.Item>
              <Form.Item label={t('Recipient')} name="recipient" validateFirst={true} rules={[{ required: true }]}>
                <Input
                  onChange={() => {
                    //
                  }}
                  disabled={!isToReady}
                  size="large"
                  suffix={!isToReady && <LockOutlined />}
                />
              </Form.Item>

              {!isToReady && (
                <span className="text-gray-300">{t('You must select the destination network to unlock')}</span>
              )}
            </Form.Item>

            <Form.Item label={t('Assets')} name="assets" rules={[{ required: true }]}>
              <Select
                onChange={() => {
                  //
                }}
                size="large"
                suffixIcon={<DownIcon />}
              >
                <Select.Option value="ring"> ring </Select.Option>
                <Select.Option value="kton"> kton </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={t('Amount')}
              name="amount"
              rules={[{ required: true }, { pattern: /^[\d,]+(.\d{1,3})?$/ }]}
            >
              <Balance
                placeholder={t('Available balance: {{balance}}', { balance: '99' })}
                size="large"
                onChange={() => {
                  //
                }}
              />
            </Form.Item>
          </>
        )}

        <SubmitButton {...transfer} network={network} networkStatus={networkStatus} isBridgeReady={isBridgeReady} />
      </Form>
      {/* 
      <TransferAlertModal
        cancel={() => {
          //
        }}
        recipient={form.getFieldValue('recipient')}
        confirm={() => {
          //
        }}
      /> */}

      {/* <TransferConfirmModal /> */}

      {/* <AccountModal
        // isVisible={}
        // assets={assets}
        cancel={() => {
          //
        }}
        confirm={() => {
          // do nothing
        }}
      /> */}
    </>
  );
}

function FromItemButton({ children, ...others }: ButtonProps) {
  return (
    <Form.Item className="mt-12">
      <Button {...others}>{children}</Button>
    </Form.Item>
  );
}

interface SubmitButtonProps {
  networkStatus: ConnectStatus;
  isBridgeReady: boolean;
  network: Network | null | undefined;
  from: NetConfig | null;
  to: NetConfig | null;
}

// eslint-disable-next-line complexity
function SubmitButton({ networkStatus, network, from, to, isBridgeReady }: SubmitButtonProps) {
  const { t } = useTranslation();
  const { switchNetwork } = useApi();

  const buttonProps: ButtonProps = useMemo(
    () => ({
      type: 'primary',
      className: 'block mx-auto w-full rounded-xl text-white',
      size: 'large',
    }),
    []
  );

  if (from?.name && to?.name && !isBridgeReady) {
    return (
      <FromItemButton {...buttonProps} disabled>
        {t('Coming soon')}
      </FromItemButton>
    );
  }

  if (networkStatus === 'success' && !!from?.name && from?.name !== network) {
    return (
      <FromItemButton
        {...buttonProps}
        onClick={() => {
          if (from?.name) {
            switchNetwork(from.name);
          }
        }}
      >
        {t('Switch to {{network}}', { network: from?.name })}
      </FromItemButton>
    );
  }

  if (networkStatus === 'connecting') {
    return (
      <FromItemButton {...buttonProps} disabled>
        {t('Connecting node')}
      </FromItemButton>
    );
  }

  if (networkStatus !== 'success' && !!from?.name) {
    return (
      <FromItemButton
        {...buttonProps}
        onClick={() => {
          switchNetwork(from.name);
        }}
      >
        {t('Connect to {{network}}', { network: from.name })}
      </FromItemButton>
    );
  }

  if (networkStatus === 'success' && !from?.name) {
    return null;
  }

  return (
    <FromItemButton {...buttonProps} htmlType="submit">
      {t('Confirm to transfer')}
    </FromItemButton>
  );
}
