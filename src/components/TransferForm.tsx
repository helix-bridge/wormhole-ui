import { Form } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL, validateMessages } from '../config';
import { useApi, useTx } from '../hooks';
import { BridgeFormProps, Bridges, NetConfig, Network, TransferFormValues, TransferNetwork } from '../model';
import { empty, getInitialSetting, getNetworkByName } from '../utils';
import { Airport } from './Airport';
import { Nets } from './controls/Nets';
import { Darwinia } from './departure/Darwinia';
import { Ethereum } from './departure/Ethereum';
import { FromItemButton, SubmitButton } from './SubmitButton';

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

const getDeparture: (from: NetConfig | undefined | null) => FunctionComponent<BridgeFormProps & Bridges> = (from) => {
  if (!from) {
    return () => <></>;
  }

  const Comp = DEPARTURES[from.name];

  if (Comp) {
    return Comp;
  }

  const typeName = from.type.reverse().find((type) => DEPARTURES[type as Network]) as Network;

  if (typeName) {
    return DEPARTURES[typeName] as FunctionComponent<BridgeFormProps & Bridges>;
  }

  return () => <span>Coming Soon...</span>;
};

// eslint-disable-next-line complexity
export function TransferForm({ isCross = true }: { isCross?: boolean }) {
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
            isCross={isCross}
          />
        </Form.Item>

        {isCross && isFromReady ? (
          React.createElement(getDeparture(form.getFieldValue(FORM_CONTROL.transfer).from), { form, setSubmit })
        ) : (
          <Airport form={form} setSubmit={setSubmit} />
        )}

        <div className={networkStatus === 'success' && transfer.from ? 'grid grid-cols-2 gap-4' : ''}>
          <SubmitButton {...transfer} requireTo />

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
