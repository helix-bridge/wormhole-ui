import { Form, Select } from 'antd';
import { capitalize } from 'lodash';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL } from '../../../config';
import { useApi } from '../../../hooks';
import { CrossChainComponentProps, DVMChainConfig, PolkadotChainConfig, Substrate2DVMPayload } from '../../../model';
import { Balance } from '../../form-control/Balance';
import { EthereumAccountItem } from '../../form-control/EthereumAccountItem';
import { RecipientItem } from '../../form-control/RecipientItem';
import { DownIcon } from '../../icons';

export function DVMSubstrate({
  form,
  direction,
}: CrossChainComponentProps<Substrate2DVMPayload, PolkadotChainConfig, DVMChainConfig>) {
  const { t } = useTranslation();
  const { chain } = useApi();

  //   useEffect(() => {
  //     const sub$$ = from(getBalances());
  //   }, []);

  return (
    <>
      <EthereumAccountItem form={form} />

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
          suffixIcon={<DownIcon />}
        >
          {(chain.tokens || []).map(({ symbol }, index) => (
            <Select.Option value={symbol} key={symbol + '_' + index} disabled={/kton/i.test(symbol)}>
              <span>{symbol}</span>
              {/** FIXME: what's the name ? we can only get symbol, decimals and ss58Format from api properties  */}
              <sup className="ml-2 text-xs" title={t('name')}>
                {t('{{network}} native token', {
                  network: capitalize(form.getFieldValue(FORM_CONTROL.direction)?.from?.name ?? ''),
                })}
              </sup>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label={t('Amount')} name="amount" rules={[{ required: true }, { pattern: /^[\d,]+(.\d{1,3})?$/ }]}>
        <Balance placeholder={t('Available balance: {{balance}}', { balance: '0' })} size="large" className="flex-1" />
      </Form.Item>
    </>
  );
}
