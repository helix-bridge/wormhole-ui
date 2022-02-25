import { Form, Select } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { from } from 'rxjs';
import { FORM_CONTROL } from '../../../config';
import { useDarwiniaAvailableBalances, useIsMountedOperator } from '../../../hooks';
import {
  AvailableBalance,
  CrossChainComponentProps,
  DVMChainConfig,
  PolkadotChainConfig,
  Substrate2DVMPayload,
} from '../../../model';
import { Balance } from '../../form-control/Balance';
import { PolkadotAccountsItem } from '../../form-control/PolkadotAccountsItem';
import { RecipientItem } from '../../form-control/RecipientItem';

export function SubstrateDVM({
  form,
  direction,
}: CrossChainComponentProps<Substrate2DVMPayload, PolkadotChainConfig, DVMChainConfig>) {
  const { t } = useTranslation();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const getBalances = useDarwiniaAvailableBalances();
  const { takeWhileIsMounted } = useIsMountedOperator();

  //   useEffect(() => {
  //     const sub$$ = from(getBalances());
  //   }, []);

  return (
    <>
      <PolkadotAccountsItem
        availableBalances={availableBalances}
        onChange={(value) => from(getBalances(value)).pipe(takeWhileIsMounted()).subscribe(setAvailableBalances)}
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
        <Select
          //   onChange={(value: string) => {
          //     from(getBalances(form.getFieldValue(FORM_CONTROL.sender)))
          //       .pipe(takeWhileIsMounted())
          //       .subscribe(setAvailableBalances);
          //   }}
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
        name="amount"
        rules={[{ required: true }, { pattern: /^[\d,]+(.\d{1,3})?$/ }]}
      >
        <Balance
          placeholder={t('Available balance: {{balance}}', { balance: '0' })}
          size="large"
          className="flex-1"
        ></Balance>
      </Form.Item>
    </>
  );
}
