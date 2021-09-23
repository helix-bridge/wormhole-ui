import { QuestionCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { ApiPromise } from '@polkadot/api';
import { Button, Descriptions, Form, Select, Tooltip } from 'antd';
import BN from 'bn.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TFunction, Trans, useTranslation } from 'react-i18next';
import { from, Observable } from 'rxjs';
import Web3 from 'web3';
import { Unit } from 'web3-utils';
import { FORM_CONTROL } from '../../config';
import { useAfterSuccess, useApi, useDeparture, useTx } from '../../hooks';
import {
  BridgeFormProps,
  Darwinia2EthereumTransfer,
  NoNullTransferNetwork,
  SS58Prefix,
  Token,
  TransferFormValues,
  Tx,
} from '../../model';
import { AfterTxCreator, applyModalObs, convertToSS58, createTxWorkflow, fromWei, toWei } from '../../utils';
import { issuingDarwiniaToken, IssuingDarwiniaToken } from '../../utils/tx/d2e';
import { AssetGroup, AssetGroupValue, AvailableBalance } from '../controls/AssetGroup';
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

    return ring ? ringAmount.gte(fee) && ringAmount.lte(ringBalance) : ringBalance.gte(fee);
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
      <p className="text-red-400 animate-pulse" style={{ animationIterationCount: !fee ? 'infinite' : animationCount }}>
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

function ethereumBackingLockDarwinia(
  value: IssuingDarwiniaToken,
  after: AfterTxCreator,
  api: ApiPromise
): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <TransferConfirm value={value} />,
  });
  const obs = issuingDarwiniaToken(value, api);

  return createTxWorkflow(beforeTx, obs, after);
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

// eslint-disable-next-line complexity
export function Darwinia2Ethereum({ form, setSubmit }: BridgeFormProps<Darwinia2EthereumTransfer>) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
    api,
    chain,
  } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>(BALANCES_INITIAL);
  const [fee, setFee] = useState<BN | null>(null);
  const [payAccount, setPayAccount] = useState<string | null>(() => form.getFieldValue(FORM_CONTROL.sender) ?? null);
  const [currentAssets, setCurAssets] = useState<AssetGroupValue>([]);
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess<TransferFormValues<Darwinia2EthereumTransfer, NoNullTransferNetwork>>();
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

  const BalanceInfo = useMemo(() => {
    return (
      <span>
        {t('Balance ')}
        <span>
          {availableBalances.map(({ asset, max, chainInfo }) => (
            <span key={asset} className="mr-2">
              {fromWei({ value: max, unit: (chainInfo?.decimal as Unit) || 'gwei' })} {asset.toUpperCase()}
            </span>
          ))}
        </span>
      </span>
    );
  }, [availableBalances, t]);

  useEffect(() => {
    const fn = () => (data: IssuingDarwiniaToken) => {
      const { assets, sender } = data;
      const assetsToSend = assets?.map((item) => {
        const { asset, amount, checked } = item as Required<Darwinia2EthereumTransfer['assets'][0]>;
        const unit = getChainInfo(asset as Token)?.decimal || 'gwei';

        return { asset, unit, amount: checked ? toWei({ value: amount, unit }) : '0' };
      });

      ethereumBackingLockDarwinia(
        { ...data, assets: assetsToSend },
        afterTx(TransferSuccess, {
          hashType: 'block',
          onDisappear: () => {
            form.setFieldsValue({
              [FORM_CONTROL.sender]: sender,
              [FORM_CONTROL.assets]: [
                { asset: 'ring', amount: '', checked: true },
                { asset: 'kton', amount: '' },
              ],
            });
            getBalances(sender).then(setAvailableBalances);
          },
        })({ ...data, assets: assetsToSend }),
        api!
      ).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, api, form, getBalances, getChainInfo, observer, setSubmit]);

  useEffect(() => {
    const sub$$ = from(getBalances(payAccount ?? '')).subscribe(setAvailableBalances);

    return () => sub$$.unsubscribe();
  }, [payAccount, getBalances]);

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
  }, [form, api, accounts, updateDeparture]);

  return (
    <>
      <Form.Item
        name={FORM_CONTROL.sender}
        label={t('Payment Account')}
        rules={[{ required: true }]}
        extra={BalanceInfo}
      >
        <Select
          size="large"
          onChange={(addr: string) => {
            setPayAccount(addr);
          }}
        >
          {(accounts ?? []).map(({ meta, address }) => (
            <Select.Option value={address} key={address}>
              {meta?.name} - {convertToSS58(address, chain.ss58Format as unknown as SS58Prefix)}
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

      <TransferInfo fee={fee} ringBalance={new BN(ringBalance?.max || '0')} assets={currentAssets} t={t} />
    </>
  );
}
