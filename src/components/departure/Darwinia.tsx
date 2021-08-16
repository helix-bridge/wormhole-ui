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
import { BridgeFormProps, D2E, D2EAsset, Erc20Token, Network, Token, TransferAsset, Tx } from '../../model';
import {
  AfterTxCreator,
  applyModalObs,
  createTxWorkflow,
  empty,
  fromWei,
  getUnit,
  prettyNumber,
  toWei,
} from '../../utils';
import { backingLock, backingLockErc20, BackingLockERC20, BackingLockNative } from '../../utils/tx/d2e';
import { AssetGroup, AvailableBalance } from '../controls/AssetGroup';
import { Balance } from '../controls/Balance';
import { Erc20Control } from '../controls/Erc20Control';
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

function ethereumBackingLockErc20(value: BackingLockERC20, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <TransferConfirm value={value} />,
  });
  const obs = backingLockErc20(value);

  return createTxWorkflow(beforeTx, obs, after);
}

// eslint-disable-next-line complexity
export function Darwinia({ form, setSubmit }: BridgeFormProps<D2E>) {
  const { t } = useTranslation();
  const { accounts, api, chain } = useApi();
  const [assetType, setAssetType] = useState<D2EAssetEnum>(
    () => form.getFieldValue(FORM_CONTROL.assetType) ?? D2EAssetEnum.native
  );
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>(BALANCES_INITIAL);
  const [fee, setFee] = useState<BN | null>(null);
  const [selectedErc20, setSelectedErc20] = useState<Erc20Token | null>(null);
  const [updateErc20, setUpdateErc20] = useState<(addr: string) => Promise<void>>(() => Promise.resolve());
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess();
  const getChainInfo = useCallback(
    (target: Token) => target && chain.tokens.find((token) => token.symbol.toLowerCase().includes(target)),
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
        fn = () => (data: BackingLockERC20) => {
          return ethereumBackingLockErc20(
            data,
            afterTx(TransferSuccess, { onDisappear: () => updateErc20(data.erc20.address) })(data)
          ).subscribe(observer);
        };
      } else {
        fn = () => (data: BackingLockNative) => {
          const { assets } = data;
          const assetsToSend = assets?.map((item) => {
            const { asset, amount, checked } = item as Required<TransferAsset<D2EAsset>>;
            const unit = getChainInfo(asset as Token)?.decimal || 'gwei';

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
            api!
          ).subscribe(observer);
        };
      }

      setSubmit(fn);
    },
    [afterTx, api, form, getBalances, getChainInfo, observer, setSubmit, updateErc20]
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
    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender });
  }, [form, api, accounts, updateSubmit, updateDeparture]);

  useEffect(() => {
    const isErc20 = assetType === D2EAssetEnum.erc20;

    updateSubmit(isErc20);
  }, [assetType, updateSubmit]);

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
        isDvm={assetType === D2EAssetEnum.erc20}
      />

      <Form.Item initialValue={D2EAssetEnum.native} name={FORM_CONTROL.assetType} label={t('Asset Type')}>
        <Radio.Group
          onChange={(event) => {
            setAssetType(event.target.value);
            form.validateFields([FORM_CONTROL.assets, FORM_CONTROL.recipient]);
          }}
        >
          <Radio value={D2EAssetEnum.native}>{t('Native')}</Radio>
          <Radio value={D2EAssetEnum.erc20}>ERC20</Radio>
        </Radio.Group>
      </Form.Item>

      {assetType === D2EAssetEnum.native ? (
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
        <>
          <Form.Item name={FORM_CONTROL.erc20} label={t('Asset')} rules={[{ required: true }]} className="mb-2">
            <Erc20Control
              network={form.getFieldValue(FORM_CONTROL.transfer).from.name}
              onChange={(erc20) => {
                setSelectedErc20(erc20);
              }}
              updateBalance={setUpdateErc20}
            />
          </Form.Item>
          <Form.Item
            name={FORM_CONTROL.amount}
            label={t('Amount')}
            rules={[
              { required: true },
              {
                // eslint-disable-next-line complexity
                validator: () => {
                  const ring = availableBalances.find((item) => item.asset === 'ring');
                  // eslint-disable-next-line no-magic-numbers
                  const unit = getUnit(+ring!.chainInfo!.decimal ?? 18) ?? 'ether';
                  const feeFormatted = fromWei({ value: fee, unit: ring?.chainInfo?.decimal ?? 'ether' });
                  const feeBn = new BN(toWei({ value: feeFormatted, unit }));
                  const maxRingBn = new BN(ring?.max ?? '0');

                  return maxRingBn.lte(feeBn)
                    ? Promise.resolve()
                    : Promise.reject('The RING balance is not enough to cover the fee.');
                },
                message: t('The RING balance is not enough to cover the fee.'),
              },
              {
                validator: (_, value: string) => {
                  const ring = availableBalances.find((item) => item.asset === 'ring');
                  // eslint-disable-next-line no-magic-numbers
                  const unit = getUnit(+ring!.chainInfo!.decimal ?? 18) ?? 'ether';
                  const val = new BN(toWei({ value, unit }));

                  return val.gt(selectedErc20?.balance ?? new BN(0))
                    ? Promise.resolve()
                    : Promise.reject('The transfer amount must less or equal than the balance');
                },
                message: t('The transfer amount must less or equal than the balance'),
              },
            ]}
          >
            <Balance
              size="large"
              placeholder={t('Balance {{balance}}', {
                balance: fromWei({
                  value: selectedErc20?.balance.toString(),
                  // eslint-disable-next-line no-magic-numbers
                  unit: getUnit((selectedErc20 && +selectedErc20.decimals) || 18),
                }),
              })}
              className="flex-1"
            >
              <MaxBalance
                network={form.getFieldValue(FORM_CONTROL.transfer).from?.name as Network}
                onClick={() => {
                  const unit = getUnit(+(selectedErc20?.decimals ?? '18'));
                  const amount = fromWei({ value: selectedErc20?.balance, unit }, prettyNumber);

                  form.setFieldsValue({ [FORM_CONTROL.amount]: amount });
                }}
                size="large"
              />
            </Balance>
          </Form.Item>
        </>
      )}
    </>
  );
}
