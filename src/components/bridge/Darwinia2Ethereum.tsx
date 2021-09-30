import { QuestionCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { ApiPromise } from '@polkadot/api';
import { Button, Descriptions, Form, Tooltip } from 'antd';
import BN from 'bn.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TFunction, Trans, useTranslation } from 'react-i18next';
import { from, Observable } from 'rxjs';
import Web3 from 'web3';
import { FORM_CONTROL } from '../../config';
import { useAfterSuccess, useApi, useDeparture, useTx } from '../../hooks';
import {
  AvailableBalance,
  BridgeFormProps,
  Darwinia2EthereumTransfer,
  IssuingDarwiniaToken,
  NoNullTransferNetwork,
  Token,
  TokenChainInfo,
  TransferFormValues,
  Tx,
} from '../../model';
import { AfterTxCreator, applyModalObs, createTxWorkflow, fromWei, issuingDarwiniaTokens, toWei } from '../../utils';
import { AssetGroup, AssetGroupValue } from '../controls/AssetGroup';
import { PolkadotAccountsItem } from '../controls/PolkadotAccountsItem';
import { RecipientItem } from '../controls/RecipientItem';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

interface AmountCheckInfo {
  fee: BN | null;
  ringBalance?: BN | null;
  assets: AssetGroupValue;
  t: TFunction;
}

const BN_ZERO = new BN(0);

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

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

export const getChainInfo = (tokens: TokenChainInfo[], target: Token) =>
  target && tokens.find((token) => token.symbol.toLowerCase().includes(target));

// eslint-disable-next-line complexity
function TransferInfo({ fee, ringBalance, assets, t }: AmountCheckInfo) {
  const { chain } = useApi();
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
  const chainSymbol = useCallback(
    (token: Token) => {
      const info = getChainInfo(chain.tokens, 'ring');

      return info?.symbol || token.toUpperCase();
    },
    [chain.tokens]
  );
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
                    })} ${chainSymbol('ring')}`}</span>
                  );
                } else {
                  return <span className="mr-2" key={asset}>{`${amount ?? 0} ${chainSymbol('kton')}`}</span>;
                }
              }
            })}
          </p>
        </Descriptions.Item>
      )}

      <Descriptions.Item label={<Trans>Cross-chain Fee</Trans>} contentStyle={{ color: 'inherit' }}>
        <span className="flex items-center">
          {fromWei({ value: fee, unit: 'gwei' })} {chainSymbol('ring')}
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
  const obs = issuingDarwiniaTokens(value, api);

  return createTxWorkflow(beforeTx, obs, after);
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangolin -> ropsten
 */
// eslint-disable-next-line complexity
export function Darwinia2Ethereum({ form, setSubmit }: BridgeFormProps<Darwinia2EthereumTransfer>) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
    api,
    chain,
  } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const [fee, setFee] = useState<BN | null>(null);
  const [currentAssets, setCurAssets] = useState<AssetGroupValue>([]);
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess<TransferFormValues<Darwinia2EthereumTransfer, NoNullTransferNetwork>>();
  const ringBalance = useMemo(
    () => (availableBalances || []).find((item) => item.asset === 'ring'),
    [availableBalances]
  );
  const getBalances = useCallback<(acc: string) => Promise<AvailableBalance[]>>(
    async (account) => {
      if (!api) {
        return [];
      }

      const {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        data: { free: ring = '0', freeKton: kton = '0' },
      } = await api.query.system.account(account);

      return [
        {
          max: ring,
          asset: 'ring',
          chainInfo: getChainInfo(chain.tokens, 'ring'),
          checked: true,
        },
        {
          max: kton,
          asset: 'kton',
          chainInfo: getChainInfo(chain.tokens, 'kton'),
        },
      ];
    },
    [api, chain.tokens]
  );

  useEffect(() => {
    const fn = () => (data: IssuingDarwiniaToken) => {
      const { assets, sender } = data;
      const assetsToSend = assets?.map((item) => {
        const { asset, amount, checked } = item as Required<Darwinia2EthereumTransfer['assets'][0]>;
        const unit = getChainInfo(chain.tokens, asset as Token)?.decimal || 'gwei';

        return { asset, unit, amount: checked ? toWei({ value: amount, unit }) : '0' };
      });

      return ethereumBackingLockDarwinia(
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
  }, [afterTx, api, chain.tokens, form, getBalances, observer, setSubmit]);

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

  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    getBalances(sender).then(setAvailableBalances);
  }, [accounts, getBalances]);

  return (
    <>
      <PolkadotAccountsItem
        getBalances={getBalances}
        onChange={(value) => getBalances(value).then(setAvailableBalances)}
      />

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
