import { Form, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { Unit } from 'web3-utils';
import { FORM_CONTROL } from '../../config';
import { useApi } from '../../hooks';
import { AvailableBalance } from '../../model';
import { fromWei } from '../../utils';
import { IdentAccountAddress } from '../widget/account';

interface PolkadotAccountsProps {
  onChange?: (acc: string) => void;
  availableBalances: AvailableBalance[];
}

export function PolkadotAccountsItem({ onChange, availableBalances }: PolkadotAccountsProps) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
  } = useApi();

  return (
    <Form.Item
      name={FORM_CONTROL.sender}
      label={t('Sender Account')}
      rules={[{ required: true }]}
      extra={
        <span className="text-xs ml-4">
          {t('Balance ')}
          <span className="ml-2">
            {availableBalances.length
              ? availableBalances.map(({ asset, max, chainInfo }, index) => (
                  <span key={asset || index} className="mr-2">
                    {fromWei({ value: max, unit: (chainInfo?.decimal as Unit) || 'gwei' })} {chainInfo?.symbol}
                  </span>
                ))
              : '-'}
          </span>
        </span>
      }
    >
      <Select
        size="large"
        onChange={(addr: string) => {
          if (onChange) {
            onChange(addr);
          }
        }}
      >
        {(accounts ?? []).map((item) => (
          <Select.Option value={item.address} key={item.address}>
            <IdentAccountAddress account={item} iconSize={24} />
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
}
