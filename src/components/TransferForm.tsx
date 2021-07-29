import { Button, ButtonProps, Form, Modal, ModalProps } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { FORM_CONTROL, validateMessages } from '../config';
import { Path } from '../config/routes';
import { useApi, useTx } from '../hooks';
import { ConnectStatus, NetConfig, Network, TransferFormValues, TransferNetwork } from '../model';
import { getInitialSetting, getNetworkByName, hasBridge, isBridgeAvailable } from '../utils';
import { Ethereum } from './bridge/Ethereum';
import { ApproveConfirm } from './modal/ApproveConfirm';
import { ApproveSuccess } from './modal/ApproveSuccess';
import { NetworkControl } from './NetworkControl';
import { TxStatus } from './TxStatus';

const initTransfer: () => TransferNetwork = () => {
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

const { confirm } = Modal;

// eslint-disable-next-line complexity
export function TransferForm() {
  const { t, i18n } = useTranslation();
  const [form] = useForm<TransferFormValues>();
  const { network, networkStatus, switchNetwork } = useApi();
  const [transfer, setTransfer] = useState(TRANSFER);
  const [isFromReady, setIsFromReady] = useState(false);
  const { approve, tx } = useTx();
  const [hasModal, setHasModal] = useState(false);
  const history = useHistory();
  const modalConfig: ModalProps = useMemo(
    () => ({
      okCancel: true,
      cancelText: t('Cancel'),
      okText: t('Confirm'),
      okButtonProps: { size: 'large' },
      cancelButtonProps: { size: 'large' },
      width: 520,
      centered: true,
      className: 'confirm-modal',
      icon: null,
      afterClose: () => setHasModal(false),
    }),
    [t]
  );

  // eslint-disable-next-line complexity
  useEffect(() => {
    const { from } = transfer;
    const isReady = !!from && from.name === network && networkStatus === 'success';

    setIsFromReady(isReady);
  }, [network, networkStatus, transfer]);

  useEffect(() => {
    if (!tx || tx.status !== 'finalized') {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const value = form.getFieldsValue();

    setHasModal(true);
    confirm({
      ...modalConfig,
      content: <ApproveSuccess value={value} tx={tx} />,
      okText: t('Cross-chain history'),
      onOk: () => history.push(Path.history),
    });
  }, [tx, modalConfig, t, form, history]);

  return (
    <>
      <Form
        name={FORM_CONTROL.transfer}
        layout="vertical"
        form={form}
        initialValues={{ transfer: TRANSFER }}
        onFinish={(value) => {
          console.info('🚀 ~ file: TransferForm.tsx ~ line 71 ~ TransferForm ~ value', value);

          setHasModal(true);

          confirm({
            ...modalConfig,
            content: <ApproveConfirm value={value} />,
            onOk: () => approve(value),
          });
        }}
        validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
        className={hasModal ? 'filter blur-sm drop-shadow' : ''}
      >
        <Form.Item
          name={FORM_CONTROL.transfer}
          rules={[
            { required: true, message: t('Both send and receive network are all required') },
            {
              validator: (_, value: TransferNetwork) => {
                return value.from && value.to ? Promise.resolve() : Promise.reject();
              },
              message: t('You maybe forgot to select receive or sender network'),
            },
          ]}
        >
          <NetworkControl
            onChange={(value) => {
              setTransfer(value);
            }}
          />
        </Form.Item>

        {isFromReady && (
          <>
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            <Ethereum form={form} />
          </>
        )}

        {!tx ? (
          <div className={networkStatus === 'success' && transfer.from ? 'grid grid-cols-2 gap-4' : ''}>
            <SubmitButton {...transfer} network={network} networkStatus={networkStatus} />

            {networkStatus === 'success' && (
              <FromItemButton
                type="default"
                onClick={() => {
                  const transferEmpty = { from: null, to: null };

                  setIsFromReady(false);
                  setTransfer(transferEmpty);
                  form.setFieldsValue({ transfer: transferEmpty });
                  form.resetFields();
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
  network: Network | null | undefined;
  from: NetConfig | null;
  to: NetConfig | null;
}

// eslint-disable-next-line complexity
function SubmitButton({ networkStatus, network, from, to }: SubmitButtonProps) {
  const { t } = useTranslation();
  const { switchNetwork } = useApi();
  const errorConnections: ConnectStatus[] = ['pending', 'disconnected', 'fail'];

  if (from?.name && to?.name && hasBridge(from.name, to.name) && !isBridgeAvailable(from.name, to.name)) {
    return <FromItemButton disabled>{t('Coming soon')}</FromItemButton>;
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
      <FromItemButton onClick={() => switchNetwork(from.name)}>
        {t('Connect to {{network}}', { network: from.name })}
      </FromItemButton>
    );
  }

  if ((networkStatus === 'success' && !from?.name) || networkStatus === 'pending') {
    return null;
  }

  return (
    <FromItemButton disabled={!to} htmlType="submit">
      {t('Submit')}
    </FromItemButton>
  );
}
