import { QuestionCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { ApiPromise } from '@polkadot/api';
import { Button, Descriptions, Form, Select, Tooltip } from 'antd';
import BN from 'bn.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TFunction, Trans, useTranslation } from 'react-i18next';
import { from, Observable } from 'rxjs';
import Web3 from 'web3';
import { FORM_CONTROL } from '../../config';
import { useAfterSuccess, useApi, useDeparture, useTx } from '../../hooks';
import { BridgeFormProps, D2E, Erc20Token, Network, Token, Tx } from '../../model';
import { AfterTxCreator, applyModalObs, createTxWorkflow, fromWei, getUnit, prettyNumber, toWei } from '../../utils';
import { backingLockErc20, BackingLockERC20 } from '../../utils/tx/d2e';
import { AssetGroup, AssetGroupValue, AvailableBalance } from '../controls/AssetGroup';
import { Balance } from '../controls/Balance';
import { Erc20Control } from '../controls/Erc20Control';
import { MaxBalance } from '../controls/MaxBalance';
import { RecipientItem } from '../controls/RecipientItem';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

interface AmountCheckInfo {
  fee: BN | null;
  ringBalance?: BN | null;
  assets: AssetGroupValue;
  t: TFunction;
}

const BALANCES_INITIAL: AvailableBalance[] = [
  { max: 0, asset: 'ring' },
  { max: 0, asset: 'kton' },
];

const BN_ZERO = new BN(0);

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

// eslint-disable-next-line complexity
function TransferInfo({ fee, ringBalance, assets, t }: AmountCheckInfo) {
  // eslint-disable-next-line complexity
  const isRingBalanceEnough = useMemo(() => {
    if (!fee || !ringBalance) {
      return false;
    }

    const ring = assets.find((item) => item.asset === 'ring' && item.checked);
    const ringAmount = new BN(toWei({ value: ring?.amount || '0', unit: 'gwei' }));

    return ring ? ringAmount.add(fee).lte(ringBalance) : ringBalance.gte(fee);
  }, [assets, fee, ringBalance]);

  const hasAssetSet = useMemo(() => {
    const target = assets.find((item) => item.asset === 'ring');
    const origin = new BN(toWei({ value: target?.amount ?? '0', unit: 'gwei' }));

    return (
      origin.gte(fee || BN_ZERO) &&
      !!assets.filter((item) => !!item.checked && new BN(item?.amount || '0').gt(BN_ZERO)).length
    );
  }, [assets, fee]);
  const animationCount = 5;

  if (!fee || !ringBalance) {
    return (
      <p
        className="text-red-400 animate-pulse px-2"
        style={{ animationIterationCount: !fee ? 'infinite' : animationCount }}
      >
        {t('Transfer information querying')}
      </p>
    );
  }

  return (
    <Descriptions
      size="small"
      column={1}
      labelStyle={{ color: 'inherit' }}
      className={`${isRingBalanceEnough ? 'text-green-400' : 'text-red-400 animate-pulse'}`}
      style={{ animationIterationCount: animationCount }}
    >
      {hasAssetSet && (
        <Descriptions.Item label={<Trans>Recipient will receive</Trans>} contentStyle={{ color: 'inherit' }}>
          <p className="flex flex-col">
            {assets.map((item) => {
              if (!item.checked) {
                return null;
              } else {
                const { asset, amount } = item;

                if (asset === 'ring') {
                  const origin = new BN(toWei({ value: amount, unit: 'gwei' }));

                  return (
                    <span className="mr-2" key={asset}>{`${fromWei({
                      value: origin.sub(fee),
                      unit: 'gwei',
                    })} ${asset.toUpperCase()}`}</span>
                  );
                } else {
                  return <span className="mr-2" key={asset}>{`${amount ?? 0} ${asset?.toUpperCase()}`}</span>;
                }
              }
            })}
          </p>
        </Descriptions.Item>
      )}

      <Descriptions.Item label={<Trans>Cross-chain Fee</Trans>} contentStyle={{ color: 'inherit' }}>
        <span className="flex items-center">
          {fromWei({ value: fee, unit: 'gwei' })} RING{' '}
          <Tooltip
            title={
              <ul className="pl-4 list-disc">
                <li>
                  <Trans>Fee paid per transaction</Trans>
                </li>
                <li>
                  <Trans>If the transaction includes RING, the number of RING cannot be less than the fee</Trans>
                </li>
              </ul>
            }
          >
            <QuestionCircleFilled className="ml-2 cursor-pointer" />
          </Tooltip>
        </span>
      </Descriptions.Item>
    </Descriptions>
  );
}

/* ----------------------------------------------Tx section-------------------------------------------------- */

function ethereumBackingLockErc20(value: BackingLockERC20, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <TransferConfirm value={value} />,
  });
  const obs = backingLockErc20(value);

  return createTxWorkflow(beforeTx, obs, after);
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

// eslint-disable-next-line complexity
export function DarwiniaDVM2Ethereum({ form, setSubmit }: BridgeFormProps<D2E>) {
  const { t } = useTranslation();
  const { accounts, api, chain } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>(BALANCES_INITIAL);
  const [fee, setFee] = useState<BN | null>(null);
  const [currentAssets, setCurAssets] = useState<AssetGroupValue>([]);
  const [selectedErc20, setSelectedErc20] = useState<Erc20Token | null>(null);
  const [updateErc20, setUpdateErc20] = useState<(addr: string) => Promise<void>>(() => Promise.resolve());
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess();
  const ringBalance = useMemo(
    () => (availableBalances || []).find((item) => item.asset === 'ring'),
    [availableBalances]
  );
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

  const updateSubmit = useCallback(() => {
    const fn = () => (data: BackingLockERC20) => {
      return ethereumBackingLockErc20(
        data,
        afterTx(TransferSuccess, { onDisappear: () => updateErc20(data.erc20.address) })(data)
      ).subscribe(observer);
    };
    setSubmit(fn);
  }, [afterTx, observer, setSubmit, updateErc20]);

  useEffect(() => {
    const sub$$ = from(getBalances(form.getFieldValue(FORM_CONTROL.sender))).subscribe(setAvailableBalances);

    return () => sub$$.unsubscribe();
  }, [form, getBalances]);

  // eslint-disable-next-line complexity
  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    form.setFieldsValue({
      [FORM_CONTROL.sender]: sender,
      [FORM_CONTROL.assets]: [
        { asset: 'ring', amount: '', checked: true },
        { asset: 'kton', amount: '' },
      ],
    });

    const sub$$ = from(getFee(api)).subscribe((crossFee) => setFee(crossFee));

    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender });

    return () => sub$$.unsubscribe();
  }, [form, api, accounts, updateSubmit, updateDeparture]);

  return (
    <>
      <Form.Item name={FORM_CONTROL.sender} label={t('Payment Account')} rules={[{ required: true }]}>
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
        isDvm={true}
      />

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
      >
        <AssetGroup
          network={form.getFieldValue(FORM_CONTROL.transfer).from.name}
          balances={availableBalances}
          fee={fee}
          form={form}
          onChange={(value) => setCurAssets(value)}
        />
      </Form.Item>

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
                : Promise.reject('The ring balance it not enough to cover the fee');
            },
            message: t('The ring balance it not enough to cover the fee'),
          },
          {
            validator: (_, value: string) => {
              const ring = availableBalances.find((item) => item.asset === 'ring');
              // eslint-disable-next-line no-magic-numbers
              const unit = getUnit(+ring!.chainInfo!.decimal ?? 18) ?? 'ether';
              const val = new BN(toWei({ value, unit }));

              return val.gt(selectedErc20?.balance ?? BN_ZERO)
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

      <TransferInfo fee={fee} ringBalance={new BN(ringBalance?.max || '0')} assets={currentAssets} t={t} />
    </>
  );
}
