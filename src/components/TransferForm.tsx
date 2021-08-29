import { Form } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { isEqual } from 'lodash';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL, validateMessages } from '../config';
import { useApi, useTx } from '../hooks';
import {
  BridgeFormProps,
  Bridges,
  Departure,
  NetConfig,
  Network,
  NetworkMode,
  TransferFormValues,
  TransferNetwork,
} from '../model';
import { empty, getNetConfigByVer, getNetworkMode, getInitialSetting, isSameNetConfig } from '../utils';
import { Airport } from './Airport';
import { Darwinia2Ethereum } from './bridge/Darwinia2Ethereum';
import { DarwiniaDVM2Ethereum } from './bridge/DarwiniaDVM2Ethereum';
import { Ethereum2Darwinia } from './bridge/Ethereum2Darwinia';
import { Nets } from './controls/Nets';
import { FromItemButton, SubmitButton } from './SubmitButton';

const initTransfer: () => TransferNetwork = () => {
  const come = getInitialSetting('from', '') as Network;
  const go = getInitialSetting('to', '') as Network;
  const fromMode = getInitialSetting('fMode', '') as NetworkMode;
  const toMode = getInitialSetting('tMode', '') as NetworkMode;
  const from = getNetConfigByVer({ network: come, mode: fromMode });
  const to = getNetConfigByVer({ network: go, mode: toMode });

  if (from?.isTest === to?.isTest) {
    return { from, to };
  } else if (from) {
    return { from, to: null };
  } else {
    return { from: null, to };
  }
};

const TRANSFER = initTransfer();

const DEPARTURES: Map<Departure, FunctionComponent<BridgeFormProps & Bridges>> = new Map([
  [{ network: 'ethereum', mode: 'native' }, Ethereum2Darwinia],
  [{ network: 'ropsten', mode: 'native' }, Ethereum2Darwinia],
  [{ network: 'darwinia', mode: 'native' }, Darwinia2Ethereum],
  [{ network: 'pangolin', mode: 'native' }, Darwinia2Ethereum],
  [{ network: 'darwinia', mode: 'dvm' }, DarwiniaDVM2Ethereum],
  [{ network: 'pangolin', mode: 'dvm' }, DarwiniaDVM2Ethereum],
]);

/**
 * TODO: add departures to network_graph config
 */
const getDeparture: (from: NetConfig | undefined | null) => FunctionComponent<BridgeFormProps & Bridges> = (from) => {
  if (!from) {
    return () => <></>;
  }

  const source = [...DEPARTURES];
  const mode = getNetworkMode(from);

  const findBy = (network: Network) => source.find(([departure]) => isEqual(departure, { network, mode }));

  const target = findBy(from.name);

  if (target) {
    return target[1];
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
    const isReady = !!from && isSameNetConfig(from, network) && networkStatus === 'success';

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
