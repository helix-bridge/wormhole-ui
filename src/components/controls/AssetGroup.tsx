import { Checkbox, Form } from 'antd';
import FormList from 'antd/lib/form/FormList';
import BN from 'bn.js';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL } from '../../config';
import { CustomFormControlProps, Network, Token, TransferAsset } from '../../model';
import { TokenChainInfo } from '../../providers';
import { formatBalance, getUnit } from '../../utils';
import { Balance } from './Balance';
import { MaxBalance } from './MaxBalance';

export interface AvailableBalance {
  max: string | number | BN;
  asset: Token;
  chainInfo?: TokenChainInfo;
}

type AssetGroupValue = TransferAsset<Exclude<Token, 'native'>>[];

const BALANCE_FORMATTER = { noDecimal: false, decimal: 3, withThousandSplit: true };

export function AssetGroup({
  value,
  onChange,
  network,
  balances,
}: CustomFormControlProps<AssetGroupValue> & {
  network: Network;
  balances: AvailableBalance[];
}) {
  const { t } = useTranslation();
  const triggerChange = useCallback(
    (
      val: TransferAsset<Exclude<Token, 'native'>>,
      index: number,
      origin: TransferAsset<Exclude<Token, 'native'>>[] = []
    ) => {
      if (onChange) {
        const updated = [...origin];

        updated[index] = val;
        onChange(updated);
      }
    },
    [onChange]
  );

  return (
    <>
      <FormList
        name={FORM_CONTROL.assets}
        initialValue={value}
        rules={[
          {
            validator(_, data: AssetGroupValue) {
              return data.filter((item) => !!item.checked).length > 0 ? Promise.resolve() : Promise.reject();
            },
            message: 'You must select at least one of theses assets',
          },
        ]}
      >
        {(fields) => (
          <>
            {fields?.map((field, index) => {
              const target = (value || [])[field.fieldKey];
              const balance = balances.find(
                (item) => target.asset && item.chainInfo?.symbol.toLowerCase().includes(target.asset)
              );
              const unit = balance?.chainInfo?.decimal ? getUnit(+balance.chainInfo.decimal) : 'gwei';

              return (
                <div className="flex items-center" key={field.key}>
                  <Form.Item name={[field.name, 'asset']} fieldKey={[field.fieldKey, 'asset']} className="w-20">
                    <Checkbox
                      checked={target.checked}
                      onChange={() => {
                        triggerChange({ ...target, checked: !target.checked }, index, value);
                      }}
                      className="uppercase flex flex-row-reverse"
                    >
                      {target.asset}
                    </Checkbox>
                  </Form.Item>

                  <Form.Item
                    validateFirst
                    name={[field.name, 'amount']}
                    fieldKey={[field.fieldKey, 'amount']}
                    className="flex-1 ml-4"
                    rules={[
                      { required: !!target.checked, message: t('Transfer amount is required') },
                      {
                        validator(_, val) {
                          const max = new BN(formatBalance(balance?.max + '' || '0', unit));
                          const cur = new BN(val);
                          console.info(
                            '%c [ amount validation AssetGroup ]',
                            'font-size:13px; background:lightgreen; color:black;',
                            cur.toString(),
                            unit,
                            max.toString()
                          );

                          return cur.lte(max) ? Promise.resolve() : Promise.reject();
                        },
                        message: t('Insufficient balance'),
                      },
                    ]}
                  >
                    <Balance
                      disabled={!target.checked}
                      placeholder={t('Available balance {{balance}}', {
                        balance: balance?.max
                          ? formatBalance(balance.max, unit, BALANCE_FORMATTER)
                          : t('Searching failed'),
                      })}
                      onChange={(amount) => {
                        triggerChange({ ...target, amount }, index, value);
                      }}
                      step={1}
                      precision={0}
                      className="flex-1"
                      size="large"
                    >
                      <MaxBalance
                        disabled={!target.checked}
                        network={network}
                        size="large"
                        onClick={() => {
                          const val = {
                            ...target,
                            amount: formatBalance(String(balance?.max), unit, BALANCE_FORMATTER),
                          };

                          triggerChange(val, index, value);
                        }}
                      />
                    </Balance>
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </FormList>
    </>
  );
}
