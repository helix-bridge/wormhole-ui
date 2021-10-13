import { Form, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { from } from 'rxjs';
import { Unit } from 'web3-utils';
import { FORM_CONTROL } from '../../config';
import { useApi } from '../../hooks';
import { AvailableBalance, SS58Prefix } from '../../model';
import { convertToSS58, fromWei } from '../../utils';

interface PolkadotAccountsProps {
  getBalances: (acc: string) => Promise<AvailableBalance[]>;
  onChange?: (acc: string) => void;
}

export function PolkadotAccountsItem({ getBalances, onChange }: PolkadotAccountsProps) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
    chain,
  } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);

  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    if (!sender) {
      return;
    }

    const sub$$ = from(getBalances(sender)).subscribe(setAvailableBalances);

    return () => sub$$.unsubscribe();
  }, [accounts, getBalances]);

  return (
    <Form.Item
      name={FORM_CONTROL.sender}
      label={t('Sender Account')}
      rules={[{ required: true }]}
      extra={
        <span>
          {t('Balance ')}
          <span>
            {availableBalances.map(({ asset, max, chainInfo }, index) => (
              <span key={asset || index} className="mr-2">
                {fromWei({ value: max, unit: (chainInfo?.decimal as Unit) || 'gwei' })} {chainInfo?.symbol}
              </span>
            ))}
          </span>
        </span>
      }
    >
      <Select
        size="large"
        onChange={(addr: string) => {
          getBalances(addr).then(setAvailableBalances);

          if (onChange) {
            onChange(addr);
          }
        }}
      >
        {(accounts ?? []).map(({ meta, address }) => (
          <Select.Option value={address} key={address}>
            {meta?.name} - {convertToSS58(address, chain.ss58Format as unknown as SS58Prefix)}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
}
