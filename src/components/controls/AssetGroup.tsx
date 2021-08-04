import { Checkbox, Form } from 'antd';
import FormList from 'antd/lib/form/FormList';
import BN from 'bn.js';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

type AssetGroupValue = TransferAsset<Exclude<Token, 'native'>>[];

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
  const [error, setError] = useState<string>('');
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
      <FormList
        name={FORM_CONTROL.assets}
        initialValue={value}
        rules={[
          {
            validator(_, data: AssetGroupValue) {
              const pass = data.filter((item) => !!item.checked).length > 0;
              if (!pass) {
                setError('You must select at least one of theses assets');
                return Promise.reject();
              } else {
                setError('');
                return Promise.resolve();
              }
            },
            message: 'You must select at least one of theses assets',
          },
          {
            validator(_, data: AssetGroupValue) {
              const ring = data.find((item) => item.asset === 'ring');
              const unit = ring?.unit ?? 'gwei';
              const feeBn = new BN(toWei({ value: feeFormatted, unit }));
              const maxRingBn = new BN(ringBalance?.max ?? '0');
              const curRingBn = new BN(toWei({ value: ring?.amount, unit }));
              // console.info(
              //   '%c [ current, max, fee ]-86',
              //   'font-size:13px; background:pink; color:#bf2c9f;',
              //   curRingBn.toString(),
              //   ring?.amount,
              //   maxRingBn.toString(),
              //   ringBalance?.max,
              //   feeBn.toString()
              // );

              if (feeBn.add(curRingBn).gt(maxRingBn)) {
                setError('The RING balance is not enough to cover the fee and transfer amount');
                return Promise.reject();
              }

              if (feeBn.gt(maxRingBn)) {
                setError('The RING balance is not enough to cover the fee.');
                return Promise.reject();
              }

              setError('');
              return Promise.resolve();
            },
          },
        ]}
      >
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
                <div className="flex items-center" key={field.key}>
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
                          const max = new BN(Web3.utils.fromWei(balance?.max + '' || '0', unit));
                          const cur = new BN(val);
                          // console.info(
                          //   `%c [ ${target.asset} amount validation AssetGroup ]`,
                          //   'font-size:13px; background:lightgreen; color:black;',
                          //   cur.toString(),
                          //   unit,
                          //   max.toString()
                          // );

                          return cur.lte(max.sub(new BN(fromWei({ value: fee || '50000000000' }))))
                            ? Promise.resolve()
                            : Promise.reject();
                        },
                        message: t('Insufficient balance'),
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
                      step={1}
                      precision={0}
                      className="flex-1"
                      size="large"
                    >
                      <MaxBalance
                        disabled={!target.checked || insufficient}
                        network={network}
                        size="large"
                        onClick={() => {
                          const val = {
                            ...target,
                            amount: fromWei({ value: balance?.max }),
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
      {/* TODO: form list error tip */}
      <span className="text-red-500">{t(error)}</span>

      {ringBalance && (
        <p
          className={
            fee && balances && fee.lt(new BN(toWei({ value: ringBalance.max })))
              ? 'text-green-400'
              : 'text-red-400 animate-pulse'
          }
        >
          {t(`Cross-chain transfer fee {{fee}} RING.`, {
            fee: fromWei({ value: fee, unit: ringBalance.chainInfo?.decimal ?? 'gwei' }),
          })}
        </p>
      )}
    </>
  );
}
