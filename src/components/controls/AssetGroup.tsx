import { Checkbox, Form } from 'antd';
import FormList from 'antd/lib/form/FormList';
import BN from 'bn.js';
import { useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Web3 from 'web3';
import { FORM_CONTROL } from '../../config';
import { CustomFormControlProps, Network, Token, TransferAsset } from '../../model';
import { TokenChainInfo } from '../../providers';
import { fromWei, prettyNumber, toWei } from '../../utils';
import { Balance } from './Balance';
import { MaxBalance } from './MaxBalance';

export interface AvailableBalance {
  max: string | number | BN;
  asset: Token;
  chainInfo?: TokenChainInfo;
}

export type AssetGroupValue = TransferAsset<Exclude<Token, 'native'>>[];

// eslint-disable-next-line complexity
export function AssetGroup({
  value,
  onChange,
  network,
  balances,
  fee,
}: CustomFormControlProps<AssetGroupValue> & {
  network: Network;
  fee: BN | null;
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
  const ringBalance = useMemo(() => (balances || []).find((item) => item.asset === 'ring'), [balances]);
  const feeFormatted = useMemo(() => {
    return fromWei({ value: fee, unit: ringBalance?.chainInfo?.decimal ?? 'gwei' });
  }, [fee, ringBalance]);
  const insufficient = useMemo(
    () => new BN(feeFormatted || 0).gt(new BN(ringBalance?.max || 0)),
    [feeFormatted, ringBalance?.max]
  );

  return (
    <>
      <FormList name={FORM_CONTROL.assets} initialValue={value}>
        {(fields) => (
          <>
            {/* eslint-disable-next-line complexity */}
            {fields?.map((field, index) => {
              const target = (value || [])[field.fieldKey];
              const balance = balances.find(
                (item) => target.asset && item.chainInfo?.symbol.toLowerCase().includes(target.asset)
              );
              const unit = balance?.chainInfo?.decimal || 'gwei';

              return (
                <div className="flex items-center" key={field.key + index}>
                  <Form.Item name={[field.name, 'asset']} fieldKey={[field.fieldKey, 'asset']} className="w-20">
                    <Checkbox
                      disabled={insufficient}
                      checked={!insufficient && target.checked}
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
                          const cur = new BN(toWei({ value: val, unit }));
                          let pass = true;

                          if (balance?.asset === 'ring') {
                            pass = cur.gte(fee || new BN(0));
                          }

                          return pass ? Promise.resolve() : Promise.reject();
                        },
                        message: 'The transfer amount is not enough to cover the fee',
                      },
                      {
                        validator(_, val) {
                          const max = new BN(Web3.utils.fromWei(balance?.max + '' || '0', unit));
                          const cur = new BN(toWei({ value: val, unit }));
                          let pass = true;

                          if (balance?.asset === 'ring') {
                            pass = cur.lte(max.sub(new BN(fromWei({ value: fee || '50000000000' }))));
                          }

                          return pass ? Promise.resolve() : Promise.reject();
                        },
                        message: t(`The ring balance can't cover the fee and the transfer amount`),
                      },
                      {
                        validator(_, val) {
                          const max = new BN(Web3.utils.fromWei(balance?.max + '' || '0', unit));
                          const cur = new BN(val);
                          let pass = true;

                          if (balance?.asset !== 'ring') {
                            pass = cur.lte(max);
                          }

                          return pass ? Promise.resolve() : Promise.reject();
                        },
                        message: t('Transfer amount must not be greater than the max balance'),
                      },
                    ]}
                  >
                    <Balance
                      disabled={!target.checked || insufficient}
                      placeholder={t('Balance {{balance}}', {
                        balance: balance?.max ? fromWei({ value: balance.max, unit }, prettyNumber) : t('Querying'),
                      })}
                      onChange={(amount) => {
                        triggerChange({ ...target, amount }, index, value);
                      }}
                      step={100}
                      className="flex-1"
                      size="large"
                    >
                      <MaxBalance
                        disabled={!target.checked || insufficient}
                        network={network}
                        size="large"
                        onClick={() => {
                          // FIXME: trigger amount validation
                          const max =
                            balance?.asset === 'ring'
                              ? new BN(balance?.max || '0').sub(fee || new BN(0))
                              : balance?.max;
                          const val = {
                            ...target,
                            amount: fromWei({ value: max, unit }),
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
      {!value?.filter((item) => !!item.checked).length && (
        <span className="text-red-400">
          <Trans>You must select at least one of theses assets</Trans>
        </span>
      )}
      {new BN(ringBalance?.max || '0').lt(fee || new BN(0)) && (
        <span className="text-red-400">
          <Trans>The ring balance it not enough to cover the fee</Trans>
        </span>
      )}
      {insufficient && <span className="text-red-400">{t('The ring balance it not enough to cover the fee')}</span>}
    </>
  );
}
