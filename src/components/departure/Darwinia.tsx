import { ReloadOutlined } from '@ant-design/icons';
import { ApiPromise } from '@polkadot/api';
import { Button, Form, Radio, Select, Tooltip } from 'antd';
import BN from 'bn.js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { FORM_CONTROL } from '../../config';
import { useAfterSuccess, useApi, useDeparture, useTx } from '../../hooks';
import { BridgeFormProps, D2E, D2EAsset, Token, TransferAsset, Tx } from '../../model';
import { AfterTxCreator, applyModalObs, createTxWorkflow, empty, toWei } from '../../utils';
import { backingLock, BackingLockNative } from '../../utils/tx/d2e';
import { AssetGroup, AvailableBalance } from '../controls/AssetGroup';
import { Balance } from '../controls/Balance';
import { MaxBalance } from '../controls/MaxBalance';
import { RecipientItem } from '../controls/RecipientItem';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

const BALANCES_INITIAL: AvailableBalance[] = [
  { max: 0, asset: 'ring' },
  { max: 0, asset: 'kton' },
];

enum D2EAssetEnum {
  native = 'native',
  erc20 = 'erc20',
}

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

async function getTokenBalanceDarwinia(api: ApiPromise, account = ''): Promise<[string, string]> {
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

async function getFee(api: ApiPromise | null): Promise<BN> {
  const fixed = Web3.utils.toBN('50000000000');

  try {
    if (!api) {
      return fixed;
    }

    const fee = api.consts.ethereumBacking.advancedFee.toString();

    return Web3.utils.toBN(fee);
  } catch (error) {
    return fixed;
  }
}

/* ----------------------------------------------Tx section-------------------------------------------------- */

function ethereumBackingLockDarwinia(value: BackingLockNative, after: AfterTxCreator, api: ApiPromise): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <TransferConfirm value={value} />,
  });
  const obs = backingLock(value, api);

  return createTxWorkflow(beforeTx, obs, after);
}

// eslint-disable-next-line complexity
export function Darwinia({ form, setSubmit }: BridgeFormProps<D2E>) {
  const { t } = useTranslation();
  const { accounts, api, chain } = useApi();
  const [isNative, setIsNative] = useState<boolean>(true);
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>(BALANCES_INITIAL);
  const [fee, setFee] = useState<BN | null>(null);
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess();
  const getChainInfo = useCallback(
    (target: Token) => chain.tokens.find((token) => token.symbol.toLowerCase().includes(target)),
    [chain.tokens]
  );
  const getBalances = useCallback<(acc: string) => Promise<AvailableBalance[]>>(
    async (account) => {
      if (!api) {
        return BALANCES_INITIAL;
      }

      const [ring, kton] = await getTokenBalanceDarwinia(api, account);

      return [
        {
          max: ring,
          asset: 'ring',
          chainInfo: getChainInfo('ring'),
          checked: true,
        },
        {
          max: kton,
          asset: 'kton',
          chainInfo: getChainInfo('kton'),
        },
      ];
    },
    [api, getChainInfo]
  );

  const updateSubmit = useCallback(
    (isErc20 = false) => {
      let fn = empty;

      if (isErc20) {
        fn = console.info;
      } else {
        fn = () => (data: BackingLockNative) => {
          const { assets } = data;
          const assetsToSend = assets?.map((item) => {
            const { asset, amount, checked } = item as Required<TransferAsset<D2EAsset>>;
            const unit = getChainInfo(asset)?.decimal || 'gwei';

            return { asset, unit, amount: checked ? toWei({ value: amount, unit }) : '0' };
          });

          ethereumBackingLockDarwinia(
            { ...data, assets: assetsToSend },
            afterTx(TransferSuccess, {
              hashType: 'block',
              onDisappear: () => {
                form.setFieldsValue({
                  [FORM_CONTROL.sender]: data.sender,
                  [FORM_CONTROL.assets]: [
                    { asset: 'ring', amount: '', checked: true },
                    { asset: 'kton', amount: '' },
                  ],
                });
                getBalances(form.getFieldValue(FORM_CONTROL.sender)).then(setAvailableBalances);
              },
            })({ ...data, assets: assetsToSend }),
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            api!
          ).subscribe(observer);
        };
      }

      setSubmit(fn);
    },
    [afterTx, api, form, getBalances, getChainInfo, observer, setSubmit]
  );

  useEffect(() => {
    getBalances(form.getFieldValue(FORM_CONTROL.sender)).then(setAvailableBalances);
  }, [form, getBalances]);

  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    form.setFieldsValue({
      [FORM_CONTROL.sender]: sender,
      [FORM_CONTROL.assets]: [
        { asset: 'ring', amount: '', checked: true },
        { asset: 'kton', amount: '' },
      ],
    });
    getFee(api).then((crossFee) => setFee(crossFee));
    updateSubmit();
    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender });
  }, [form, api, accounts, updateSubmit, updateDeparture]);

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
        extraTip={t(
          'After the transaction is confirmed, the account cannot be changed. Please do not fill in the exchange account.'
        )}
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
          <Radio disabled value={D2EAssetEnum.erc20}>
            ERC20
          </Radio>
        </Radio.Group>
      </Form.Item>

      {isNative ? (
        <Form.Item
          name={FORM_CONTROL.assets}
          label={
            <span className="flex items-center">
              <span className="mr-4">{t('Asset')}</span>

              <Tooltip title={t('Refresh balances')} placement="right">
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    form.validateFields(['sender']).then(({ sender }) => {
                      if (sender) {
                        getBalances(sender).then(setAvailableBalances);
                      }
                    });
                  }}
                  className="flex items-center"
                ></Button>
              </Tooltip>
            </span>
          }
          rules={[{ required: true }]}
          className="mb-0"
        >
          <AssetGroup
            network={form.getFieldValue(FORM_CONTROL.transfer).from.name}
            balances={availableBalances}
            fee={fee}
          />
        </Form.Item>
      ) : (
        <Form.Item name={FORM_CONTROL.asset} label={t('Asset')} rules={[{ required: true }]}>
          <Balance placeholder="developing" disabled size="large" className="flex-1">
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
