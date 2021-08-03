import { Button, ButtonProps, Form } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL, validateMessages } from '../config';
import { useApi, useTx } from '../hooks';
import {
  BridgeFormProps,
  Bridges,
  ConnectStatus,
  NetConfig,
  Network,
  TransferFormValues,
  TransferNetwork,
} from '../model';
import { empty, getInitialSetting, getNetworkByName, hasBridge, isBridgeAvailable, isPolkadotNetwork } from '../utils';
import { Nets } from './controls/Nets';
import { Darwinia } from './departure/Darwinia';
import { Ethereum } from './departure/Ethereum';

type Departures = { [key in Network]?: FunctionComponent<BridgeFormProps & Bridges> };

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

const DEPARTURES: Departures = {
  ethereum: Ethereum,
  darwinia: Darwinia,
};

const getDeparture: (from: NetConfig) => FunctionComponent<BridgeFormProps & Bridges> = (from) => {
  const Comp = DEPARTURES[from.name];

  if (Comp) {
    return Comp;
  }

  const typeName = from.type.reverse().find((type) => DEPARTURES[type as Network]) as Network;

  if (typeName) {
    return DEPARTURES[typeName] as FunctionComponent<BridgeFormProps & Bridges>;
  }

  return () => <span>Coming soon...</span>;
};

// eslint-disable-next-line complexity
export function TransferForm() {
  const { t, i18n } = useTranslation();
  const [form] = useForm<TransferFormValues>();
  const { network, networkStatus, disconnect } = useApi();
  const [transfer, setTransfer] = useState(TRANSFER);
  const [isFromReady, setIsFromReady] = useState(false);
  const [submitFn, setSubmit] = useState<(value: TransferFormValues) => void>(empty);
  const { tx } = useTx();

  useEffect(() => {
    const { from } = transfer;
    const isReady = !!from && from.name === network && networkStatus === 'success';

    setIsFromReady(isReady);
  }, [network, networkStatus, transfer]);

  return (
    <>
      <Form
        name={FORM_CONTROL.transfer}
        layout="vertical"
        form={form}
        initialValues={{ transfer: TRANSFER }}
        onFinish={(value) => {
          submitFn(value);
        }}
        validateMessages={validateMessages[i18n.language as 'en' | 'zh-CN' | 'zh']}
        className={tx ? 'filter blur-sm drop-shadow' : ''}
      >
        <Form.Item
          name={FORM_CONTROL.transfer}
          rules={[
            { required: true, message: t('Both send and receive network are all required') },
            {
              validator: (_, value: TransferNetwork) => {
                return (value.from && value.to) || (!value.from && !value.to) ? Promise.resolve() : Promise.reject();
              },
              message: t('You maybe forgot to select receive or sending network'),
            },
          ]}
        >
          <Nets
            onChange={(value) => {
              setTransfer(value);
            }}
          />
        </Form.Item>

        {isFromReady && (
          <>{React.createElement(getDeparture(form.getFieldValue(FORM_CONTROL.transfer).from), { form, setSubmit })}</>
        )}

        <div className={networkStatus === 'success' && transfer.from ? 'grid grid-cols-2 gap-4' : ''}>
          <SubmitButton {...transfer} />

          {networkStatus === 'success' && (
            <FromItemButton type="default" onClick={() => disconnect()} disabled={!!tx}>
              {t('Disconnect')}
            </FromItemButton>
          )}
        </div>
      </Form>
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
  from: NetConfig | null;
  to: NetConfig | null;
}

// eslint-disable-next-line complexity
function SubmitButton({ from, to }: SubmitButtonProps) {
  const { t } = useTranslation();
  const { networkStatus, network, switchNetwork, connectToEth, connectToSubstrate } = useApi();
  const { tx } = useTx();
  const errorConnections: ConnectStatus[] = ['pending', 'disconnected', 'fail'];

  if (tx) {
    return <FromItemButton disabled>{t(tx.status)}</FromItemButton>;
  }

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
      <FromItemButton
        onClick={() => {
          if (network !== from.name) {
            switchNetwork(from.name);

            return;
          }

          const isPolkadot = isPolkadotNetwork(from.name);

          if (isPolkadot) {
            connectToSubstrate();
          } else {
            connectToEth();
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
    <FromItemButton disabled={!to} htmlType="submit">
      {t('Submit')}
    </FromItemButton>
  );
}
