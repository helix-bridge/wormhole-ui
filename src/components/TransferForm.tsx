import { Form } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { isEqual } from 'lodash';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL, validateMessages } from '../config';
import { useApi, useTx } from '../hooks';
import {
  BridgeFormProps,
  Departure,
  Network,
  NetworkMode,
  TransferFormValues,
  TransferNetwork,
  TransferParty,
} from '../model';
import { empty, getInitialSetting, getNetConfigByVer, getNetworkMode, isReachable, isSameNetConfig } from '../utils';
import { Airport } from './Airport';
import { Darwinia2Ethereum } from './bridge/Darwinia2Ethereum';
import { DarwiniaDVM2Ethereum } from './bridge/DarwiniaDVM2Ethereum';
import { Ethereum2Darwinia } from './bridge/Ethereum2Darwinia';
import { Ethereum2DarwiniaDVM } from './bridge/Ethereum2DarwiniaDvm';
import { Nets } from './controls/Nets';
import { FromItemButton, SubmitButton } from './SubmitButton';

const getTransferFromSettings: () => TransferNetwork = () => {
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

const validateTransfer: (transfer: TransferNetwork, isCross: boolean) => TransferNetwork = (transfer, isCross) => {
  const { from, to } = transfer;
  const isSameEnv = from?.isTest === to?.isTest;
  const reachable = isReachable(from, isCross)(to); // from -> to is available;

  return isSameEnv && reachable ? transfer : { from: null, to: null };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEPARTURES: [[Departure, Departure?], FunctionComponent<BridgeFormProps<any>>][] = [
  [[{ network: 'ethereum', mode: 'native' }], Ethereum2Darwinia],
  [[{ network: 'ropsten', mode: 'native' }], Ethereum2Darwinia],
  [[{ network: 'darwinia', mode: 'native' }], Darwinia2Ethereum],
  [[{ network: 'pangolin', mode: 'native' }], Darwinia2Ethereum],
  [
    [
      { network: 'ethereum', mode: 'native' },
      { network: 'darwinia', mode: 'dvm' },
    ],
    Ethereum2DarwiniaDVM,
  ],
  [
    [
      { network: 'ropsten', mode: 'native' },
      { network: 'pangolin', mode: 'dvm' },
    ],
    Ethereum2DarwiniaDVM,
  ],
  [[{ network: 'darwinia', mode: 'dvm' }], DarwiniaDVM2Ethereum],
  [[{ network: 'pangolin', mode: 'dvm' }], DarwiniaDVM2Ethereum],
];

// eslint-disable-next-line complexity
const getDeparture: (transfer: TransferNetwork) => FunctionComponent<BridgeFormProps<TransferParty>> = ({
  from,
  to,
}) => {
  if (!from) {
    return () => <></>;
  }

  const fMode = getNetworkMode(from);

  if (!to) {
    const target = DEPARTURES.find(([parties]) => isEqual(parties[0], { network: from.name, mode: fMode }));

    if (target) {
      return target[1];
    }
  } else {
    const targets = DEPARTURES.filter(([parties]) => isEqual(parties[0], { network: from.name, mode: fMode }));

    if (targets.length === 1) {
      return targets[0][1];
    } else {
      const tMode = getNetworkMode(to);
      const target = targets.find(
        ([parties]) =>
          isEqual(parties[1], { network: to.name, mode: tMode }) || (parties[1] === undefined && tMode === 'native')
      );

      if (target) {
        return target[1];
      }
    }
  }

  return () => <span>Coming Soon...</span>;
};

// eslint-disable-next-line complexity
export function TransferForm({ isCross = true }: { isCross?: boolean }) {
  const { t, i18n } = useTranslation();
  const [form] = useForm<TransferFormValues>();
  const {
    network,
    connection: { status },
    disconnect,
  } = useApi();
  const [transfer, setTransfer] = useState(() => validateTransfer(getTransferFromSettings(), isCross));
  const [isFromReady, setIsFromReady] = useState(false);
  const [submitFn, setSubmit] = useState<(value: TransferFormValues) => void>(empty);
  const { tx } = useTx();

  useEffect(() => {
    const { from } = transfer;
    const isReady = !!from && isSameNetConfig(from, network) && status === 'success';

    setIsFromReady(isReady);
  }, [network, status, transfer]);

  return (
    <>
      <Form
        name={FORM_CONTROL.transfer}
        layout="vertical"
        form={form}
        initialValues={{ transfer }}
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
          React.createElement(getDeparture(transfer), { form, setSubmit })
        ) : (
          <Airport form={form} setSubmit={setSubmit} />
        )}

        <div className={status === 'success' && transfer.from ? 'grid grid-cols-2 gap-4' : ''}>
          <SubmitButton {...transfer} requireTo />

          {status === 'success' && (
            <FromItemButton type="default" onClick={() => disconnect()} disabled={!!tx}>
              {t('Disconnect')}
            </FromItemButton>
          )}
        </div>
      </Form>
    </>
  );
}
