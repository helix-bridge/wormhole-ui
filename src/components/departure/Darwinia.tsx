import { ApiPromise } from '@polkadot/api';
import { Form, Radio, Select } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL } from '../../config';
import { useApi } from '../../hooks';
import { BridgeFormProps, D2E, NoNullTransferNetwork, Token, TransferFormValues } from '../../model';
import { empty } from '../../utils';
import { AssetGroup, AvailableBalance } from '../controls/AssetGroup';
import { Balance } from '../controls/Balance';
import { MaxBalance } from '../controls/MaxBalance';
import { RecipientItem } from '../controls/RecipientItem';

const BALANCES_INITIAL: AvailableBalance[] = [
  { max: 0, asset: 'ring' },
  { max: 0, asset: 'kton' },
];

enum D2EAssetEnum {
  native = 'native',
  erc20 = 'erc20',
}

export async function getTokenBalanceDarwinia(api: ApiPromise, account = ''): Promise<[string, string]> {
  try {
    await api?.isReady;
    // type = 0 query ring balance.  type = 1 query kton balance.
    /* eslint-disable */
    const ringUsableBalance = await (api?.rpc as any).balances.usableBalance(0, account);
    const ktonUsableBalance = await (api?.rpc as any).balances.usableBalance(1, account);
    /* eslint-enable */

    return [ringUsableBalance.usableBalance.toString(), ktonUsableBalance.usableBalance.toString()];
  } catch (error) {
    return ['0', '0'];
  }
}

export function Darwinia({ form, setSubmit }: BridgeFormProps<D2E>) {
  const { t } = useTranslation();
  const { accounts, api, chain } = useApi();
  const [isNative, setIsNative] = useState<boolean>(true);
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>(BALANCES_INITIAL);
  const getBalances = useCallback<(acc: string) => Promise<AvailableBalance[]>>(
    async (account) => {
      if (!api) {
        return BALANCES_INITIAL;
      }

      const [ring, kton] = await getTokenBalanceDarwinia(api, account);
      const info = (target: Token) => chain.tokens.find((token) => token.symbol.toLowerCase().includes(target));

      return [
        {
          max: ring,
          asset: 'ring',
          chainInfo: info('ring'),
          checked: true,
        },
        {
          max: kton,
          asset: 'kton',
          chainInfo: info('kton'),
        },
      ];
    },
    [api, chain.tokens]
  );

  const updateSubmit = useCallback(
    (isErc20 = false) => {
      let fn = empty;

      if (isErc20) {
        fn = console.info;
      } else {
        fn = () => (data: TransferFormValues<D2E, NoNullTransferNetwork>) => {
          const { assets, ...others } = data;
          const assetsToSend = assets?.filter((item) => item.checked);

          console.info('%c [ data ]-80', 'font-size:13px; background:pink; color:#bf2c9f;', assetsToSend, others);
        };
      }

      setSubmit(fn);
    },
    [setSubmit]
  );

  useEffect(() => {
    getBalances(form.getFieldValue(FORM_CONTROL.sender)).then(setAvailableBalances);
  }, [form, getBalances]);

  useEffect(() => {
    form.setFieldsValue({
      [FORM_CONTROL.sender]: (accounts || [])[0].address,
      [FORM_CONTROL.assets]: [
        { asset: 'ring', amount: '', checked: true },
        { asset: 'kton', amount: '' },
      ],
    });
    updateSubmit();
  }, [form, api, accounts, updateSubmit]);

  return (
    <>
      <Form.Item name={FORM_CONTROL.sender} label={t('Departure network')} rules={[{ required: true }]}>
        <Select size="large">
          {(accounts ?? []).map(({ meta, address }) => (
            <Select.Option value={address} key={address}>
              {meta?.name} - {address}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <RecipientItem
        form={form}
        extraTip="After the transaction is confirmed, the account cannot be changed. Please do not fill in the exchange account."
      />

      <Form.Item initialValue={D2EAssetEnum.native} name={FORM_CONTROL.assetType} label={t('Asset Type')}>
        <Radio.Group
          onChange={(event) => {
            const is = event.target.value === 'native';

            setIsNative(is);
            if (is) {
              getBalances(form.getFieldValue(FORM_CONTROL.sender)).then(setAvailableBalances);
            } else {
              // erc20 query
            }
          }}
        >
          <Radio value={D2EAssetEnum.native}>{t('Native')}</Radio>
          <Radio value={D2EAssetEnum.erc20}>ERC20</Radio>
        </Radio.Group>
      </Form.Item>

      {isNative ? (
        <Form.Item name={FORM_CONTROL.assets} label={t('Asset')} rules={[{ required: true }]} className="mb-0">
          <AssetGroup network={form.getFieldValue(FORM_CONTROL.transfer).from.name} balances={availableBalances} />
        </Form.Item>
      ) : (
        <Form.Item name={FORM_CONTROL.asset} label={t('Asset')} rules={[{ required: true }]}>
          <Balance size="large" className="flex-1">
            <MaxBalance
              onClick={() => {
                console.info('xxx');
              }}
              network={form.getFieldValue(FORM_CONTROL.transfer).from.name}
              size="large"
            />
          </Balance>
        </Form.Item>
      )}
    </>
  );
}
