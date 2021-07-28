import { Button, ButtonProps, Form } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL, validateMessages } from '../config';
import { useApi, useTx } from '../hooks';
import { ConnectStatus, NetConfig, Network, TransferFormValues, TransferValue } from '../model';
import { getInitialSetting, getNetworkByName, getVertices } from '../utils';
import { Ethereum2Darwinia } from './bridge/Ethereum2Darwinia';
import { TransferControl } from './TransferControl';
import { TxStatus } from './TxStatus';

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

// eslint-disable-next-line complexity
export function TransferForm() {
  const { t, i18n } = useTranslation();
  const [form] = useForm<TransferFormValues>();
  const { network, networkStatus, accounts, switchNetwork } = useApi();
  const [transfer, setTransfer] = useState(TRANSFER);
  const [isFromReady, setIsFromReady] = useState(false);
  const [isToReady, setIsToReady] = useState(false);
  const [isBridgeReady, setIsBridgeReady] = useState(false);
  const { approve, tx } = useTx();

  // eslint-disable-next-line complexity
  useEffect(() => {
    const { from, to } = transfer;
    const isReady = !!from && from.name === network && networkStatus === 'success';
    const vertices = getVertices((from?.name ?? '') as Network, (to?.name ?? '') as Network);
    const hasBridge = !!vertices && vertices.status === 'available';

    setIsToReady(!!to);
    setIsFromReady(isReady);
    setIsBridgeReady(hasBridge || (!from?.name && !to?.name));
  }, [network, networkStatus, transfer]);

  return (
    <>
      <Form
        name={FORM_CONTROL.transfer}
        layout="vertical"
        form={form}
        initialValues={{ transfer: TRANSFER }}
        onFinish={(value) => {
          console.info('🚀 ~ file: TransferForm.tsx ~ line 71 ~ TransferForm ~ value', value);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          approve({ ...value, sender: accounts![0].address });
        }}
        validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
      >
        <Form.Item
          name={FORM_CONTROL.transfer}
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
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            <Ethereum2Darwinia form={form} sender={accounts![0].address} lock={!isToReady} />
          </>
        )}

        {!tx ? (
          <div className={networkStatus === 'success' ? 'grid grid-cols-2 gap-4' : ''}>
            <SubmitButton {...transfer} network={network} networkStatus={networkStatus} isBridgeReady={isBridgeReady} />

            {networkStatus === 'success' && (
              <FromItemButton
                type="default"
                onClick={() => {
                  const transferEmpty = { from: null, to: null };

                  setIsBridgeReady(false);
                  setIsFromReady(false);
                  setIsToReady(false);
                  setTransfer(transferEmpty);
                  form.setFieldsValue({ transfer: transferEmpty });
                  switchNetwork(null);
                }}
              >
                {t('Disconnect')}
              </FromItemButton>
            )}
          </div>
        ) : (
          <Button type="primary" size="large" className="block mx-auto mt-8 w-full rounded-xl text-white" disabled>
            {t('Transaction {{status}}', { status: tx.status })}
          </Button>
        )}
      </Form>

      <TxStatus tx={tx} />
    </>
  );
}

function FromItemButton({ children, className, ...others }: ButtonProps) {
  return (
    <Form.Item className="mt-8">
      <Button
        type="primary"
        size="large"
        {...others}
        className={`block max-auto w-full rounded-xl text-white uppercase ${className} `}
      >
        {children}
      </Button>
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

  if (from?.name && to?.name && !isBridgeReady) {
    return <FromItemButton disabled>{t('Coming soon')}</FromItemButton>;
  }

  if (networkStatus === 'success' && !!from?.name && from?.name !== network) {
    return (
      <FromItemButton
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
    return <FromItemButton disabled>{t('Connecting node')}</FromItemButton>;
  }

  if (networkStatus !== 'success' && !!from?.name) {
    return (
      <FromItemButton
        onClick={() => {
          switchNetwork(from.name);
        }}
      >
        {t('Connect to {{network}}', { network: from.name })}
      </FromItemButton>
    );
  }

  if ((networkStatus === 'success' && !from?.name) || networkStatus === 'pending') {
    return null;
  }

  return <FromItemButton htmlType="submit">{t('Confirm')}</FromItemButton>;
}
