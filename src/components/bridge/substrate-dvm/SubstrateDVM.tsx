import { Form, Select } from 'antd';
import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY, from } from 'rxjs';
import { FORM_CONTROL } from '../../../config';
import { useAfterSuccess, useApi, useDarwiniaAvailableBalances, useIsMountedOperator, useTx } from '../../../hooks';
import {
  AvailableBalance,
  CrossChainComponentProps,
  CrossChainPayload,
  DVMChainConfig,
  PolkadotChainConfig,
  SmartTxPayload,
  Substrate2DVMPayload,
} from '../../../model';
import { applyModalObs, createTxWorkflow, issuingFromSubstrate2DVM, toWei } from '../../../utils';
import { Balance } from '../../form-control/Balance';
import { PolkadotAccountsItem } from '../../form-control/PolkadotAccountsItem';
import { RecipientItem } from '../../form-control/RecipientItem';
import { TransferConfirm } from '../../modal/TransferConfirm';
import { TransferSuccess } from '../../modal/TransferSuccess';

export function SubstrateDVM({
  form,
  direction,
  setSubmit,
}: CrossChainComponentProps<Substrate2DVMPayload, PolkadotChainConfig, DVMChainConfig>) {
  const { t } = useTranslation();
  const { api } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const getBalances = useDarwiniaAvailableBalances();
  const { afterTx } = useAfterSuccess<CrossChainPayload<SmartTxPayload>>();
  const { observer } = useTx();
  const { takeWhileIsMounted } = useIsMountedOperator();

  useEffect(() => {
    const fn = () => (data: SmartTxPayload) => {
      if (!api) {
        return EMPTY.subscribe();
      }

      const { sender, asset, amount } = data;
      const unit = availableBalances.find((item) => item.token.symbol === asset)?.token.decimal || 'gwei';
      const value = {
        ...data,
        amount: toWei({ value: amount, unit }),
      };
      const beforeTransfer = applyModalObs({
        content: <TransferConfirm value={value} unit={unit} />,
      });
      const obs = issuingFromSubstrate2DVM(value, api);
      const afterTransfer = afterTx(TransferSuccess, {
        hashType: 'block',
        onDisappear: () => {
          form.setFieldsValue({
            [FORM_CONTROL.sender]: sender,
          });
          getBalances(sender).then(setAvailableBalances);
        },
        unit,
      })(value);

      return createTxWorkflow(beforeTransfer, obs, afterTransfer).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, api, availableBalances, form, getBalances, observer, setSubmit]);

  return (
    <>
      <PolkadotAccountsItem
        availableBalances={availableBalances}
        onChange={(value) => from(getBalances(value)).pipe(takeWhileIsMounted()).subscribe(setAvailableBalances)}
        form={form}
      />

      <RecipientItem
        form={form}
        direction={direction}
        extraTip={t(
          'After the transaction is confirmed, the account cannot be changed. Please do not fill in the exchange account.'
        )}
        isDvm
      />

      <Form.Item label={t('Assets')} name={FORM_CONTROL.asset} rules={[{ required: true }]}>
        <Select size="large" placeholder={t('Please select token to be transfer')}>
          {availableBalances.map(({ token: { symbol } }) => (
            <Select.Option value={symbol} key={symbol}>
              <span className="uppercase">{symbol}</span>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        validateFirst
        label={t('Amount')}
        name="amount"
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value = '0') {
              const asset = getFieldValue(FORM_CONTROL.asset);
              const target = availableBalances.find(({ token: { symbol } }) => symbol === asset);
              const max = new BN(target?.max ?? 0);
              const cur = new BN(toWei({ value, unit: target?.token.decimal ?? 'gwei' }) ?? 0);

              return cur.lt(max) ? Promise.resolve() : Promise.reject();
            },
            message: t(
              'The value entered must be greater than 0 and less than or equal to the maximum available value'
            ),
          }),
        ]}
      >
        <Balance size="large" className="flex-1"></Balance>
      </Form.Item>
    </>
  );
}
