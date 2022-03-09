import { Form, Select } from 'antd';
import BN from 'bn.js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY, from } from 'rxjs';
import { FORM_CONTROL } from '../../config';
import { useAfterTx, useApi, useDarwiniaAvailableBalances, useIsMountedOperator, useTx } from '../../hooks';
import {
  AvailableBalance,
  CrossChainComponentProps,
  CrossChainPayload,
  DVMChainConfig,
  PolkadotChainConfig,
} from '../../model';
import { applyModalObs, createTxWorkflow, fromWei, prettyNumber, toWei } from '../../utils';
import { Balance } from '../../components/form-control/Balance';
import { PolkadotAccountsItem } from '../../components/form-control/PolkadotAccountsItem';
import { RecipientItem } from '../../components/form-control/RecipientItem';
import { TransferConfirm } from '../../components/tx/TransferConfirm';
import { TransferSuccess } from '../../components/tx/TransferSuccess';
import { Substrate2DVMPayload, SmartTxPayload } from './model/cross-chain';
import { issuing } from './utils';

export function Substrate2DVM({
  form,
  direction,
  setSubmit,
}: CrossChainComponentProps<Substrate2DVMPayload, PolkadotChainConfig, DVMChainConfig>) {
  const { t } = useTranslation();
  const { api } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>(form.getFieldValue(FORM_CONTROL.asset));
  const getBalances = useDarwiniaAvailableBalances();
  const { afterCrossChain } = useAfterTx<CrossChainPayload<SmartTxPayload>>();
  const { observer } = useTx();
  const { takeWhileIsMounted } = useIsMountedOperator();

  const availableBalance = useMemo(() => {
    if (selectedToken && availableBalances.length) {
      return availableBalances.find((item) => item.token.symbol === selectedToken);
    }

    return null;
  }, [availableBalances, selectedToken]);

  useEffect(() => {
    const fn = () => (data: SmartTxPayload) => {
      if (!api) {
        return EMPTY.subscribe();
      }

      const { sender, asset, amount } = data;
      const unit = availableBalances.find((item) => item.token.symbol === asset)?.token.decimal || 'gwei';
      const value = { ...data, amount: toWei({ value: amount, unit }) };
      const beforeTransfer = applyModalObs({ content: <TransferConfirm value={value} unit={unit} /> });
      const obs = issuing(value, api);

      const afterTransfer = afterCrossChain(TransferSuccess, {
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
  }, [afterCrossChain, api, availableBalances, form, getBalances, observer, setSubmit]);

  return (
    <>
      <PolkadotAccountsItem
        availableBalances={availableBalances}
        onChange={(value) =>
          from(getBalances(value))
            .pipe(takeWhileIsMounted())
            .subscribe((data) => {
              if (!form.getFieldValue(FORM_CONTROL.asset) && data.length) {
                const symbol = data[0].token.symbol;

                form.setFieldsValue({ [FORM_CONTROL.asset as string]: symbol });
                setSelectedToken(symbol);
              }

              setAvailableBalances(data);
            })
        }
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

      <Form.Item label={t('Asset')} name={FORM_CONTROL.asset} rules={[{ required: true }]}>
        <Select
          onSelect={(symbol: string) => {
            setSelectedToken(symbol);
          }}
          size="large"
          placeholder={t('Please select token to be transfer')}
        >
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
        name={FORM_CONTROL.amount}
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
        <Balance
          placeholder={t('Available Balance {{balance}}', {
            balance: !availableBalance
              ? t('Querying')
              : fromWei({ value: availableBalance?.max, unit: availableBalance?.token.decimal }, prettyNumber),
          })}
          size="large"
          className="flex-1"
        ></Balance>
      </Form.Item>
    </>
  );
}
