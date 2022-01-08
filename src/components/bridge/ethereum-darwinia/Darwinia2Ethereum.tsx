import { QuestionCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { ApiPromise } from '@polkadot/api';
import { Button, Descriptions, Form, Spin, Tooltip } from 'antd';
import BN from 'bn.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { EMPTY, from, map, Observable } from 'rxjs';
import Web3 from 'web3';
import { FORM_CONTROL } from '../../../config';
import {
  getChainInfo,
  useAfterSuccess,
  useApi,
  useDarwiniaAvailableBalances,
  useDeparture,
  useTx,
} from '../../../hooks';
import {
  AvailableBalance,
  TransferComponentProps,
  Darwinia2EthereumTransfer,
  IssuingDarwiniaToken,
  NoNullTransferNetwork,
  TokenChainInfo,
  TransferFormValues,
} from '../../../model';
import {
  applyModalObs,
  createTxWorkflow,
  fromWei,
  getInfoFromHash,
  isRing,
  issuingDarwiniaTokens,
  toWei,
} from '../../../utils';
import { AssetGroup, AssetGroupValue } from '../../controls/AssetGroup';
import { PolkadotAccountsItem } from '../../controls/PolkadotAccountsItem';
import { RecipientItem } from '../../controls/RecipientItem';
import { TransferConfirm } from '../../modal/TransferConfirm';
import { TransferSuccess } from '../../modal/TransferSuccess';

interface AmountCheckInfo {
  fee: BN | null;
  assets: AssetGroupValue;
  availableBalance: AvailableBalance[];
}

const BN_ZERO = new BN(0);

const INITIAL_ASSETS: AssetGroupValue = [
  { asset: 'ring', amount: '', checked: true },
  { asset: 'kton', amount: '' },
];

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

async function getFee(api: ApiPromise | null): Promise<BN | null> {
  try {
    if (!api) {
      return null;
    }

    const fee = api.consts.ethereumBacking.advancedFee.toString();

    return Web3.utils.toBN(fee);
  } catch (error) {
    return null;
  }
}

// eslint-disable-next-line complexity
function TransferInfo({ fee, availableBalance, assets }: AmountCheckInfo) {
  const { chain } = useApi();
  const ringBalance = useMemo(() => {
    const ring = availableBalance.find((item) => isRing(item.asset));

    return new BN(ring?.max ?? 0);
  }, [availableBalance]);
  // eslint-disable-next-line complexity
  const isRingBalanceEnough = useMemo(() => {
    if (!fee || ringBalance.eq(BN_ZERO)) {
      return false;
    }

    const ring = assets.find((item) => isRing(item.asset) && item.checked);
    const ringAmount = new BN(toWei({ value: ring?.amount || '0', unit: 'gwei' }));

    return ring ? ringAmount.gte(fee) && ringAmount.lte(ringBalance) : ringBalance.gte(fee);
  }, [assets, fee, ringBalance]);

  const hasAssetSet = useMemo(() => !!assets.filter((item) => item.checked && item?.amount).length, [assets]);
  const chainSymbol = useCallback(
    (token: 'ring' | 'kton') => {
      const info = getChainInfo(chain.tokens, token);

      return info?.symbol || token.toUpperCase();
    },
    [chain.tokens]
  );
  const animationCount = 5;

  if (!fee || ringBalance.eq(BN_ZERO)) {
    return null;
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

                if (isRing(asset)) {
                  const origin = new BN(toWei({ value: amount, unit: 'gwei' }));

                  return (
                    <span className="mr-2" key={asset}>{`${fromWei({
                      value: origin.sub(fee),
                      unit: 'gwei',
                    })} ${chainSymbol('ring')}`}</span>
                  );
                } else {
                  return <span className="mr-2" key={asset}>{`${amount || 0} ${chainSymbol('kton')}`}</span>;
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

      <Descriptions.Item>
        <p className="text-gray-400 text-xs">
          <Trans>Please initiate a claim transaction of the Ethereum network in the Transfer Records.</Trans>
        </p>
      </Descriptions.Item>

      <Descriptions.Item>
        <p className="text-gray-400 text-xs">
          <Trans>Each claim transaction of Ethereum is estimated to use 600,000 Gas.</Trans>
        </p>
      </Descriptions.Item>
    </Descriptions>
  );
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangolin -> ropsten
 */
// eslint-disable-next-line complexity
export function Darwinia2Ethereum({ form, setSubmit, transfer }: TransferComponentProps<Darwinia2EthereumTransfer>) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
    api,
    chain,
  } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const [crossChainFee, setCrossChainFee] = useState<BN | null>(null);
  const [txFee, setTxFee] = useState<BN | null>(null);
  const [isFeeCalculating, setIsFeeCalculating] = useState<boolean>(false);
  const fee = useMemo(() => (crossChainFee && txFee ? crossChainFee.add(txFee) : null), [crossChainFee, txFee]);
  const [currentAssets, setCurAssets] = useState<AssetGroupValue>([]);
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess<TransferFormValues<Darwinia2EthereumTransfer, NoNullTransferNetwork>>();
  const getBalances = useDarwiniaAvailableBalances();
  const observe = useCallback(
    (updateFee: React.Dispatch<React.SetStateAction<BN | null>>, source: Observable<BN | null>) => {
      setIsFeeCalculating(true);

      return source.subscribe({
        next: (value) => {
          updateFee(value);
          setIsFeeCalculating(false);
        },
        error: () => setIsFeeCalculating(false),
        complete: () => setIsFeeCalculating(false),
      });
    },
    []
  );

  useEffect(() => {
    const fn = () => (data: IssuingDarwiniaToken) => {
      if (!api || !fee) {
        return EMPTY.subscribe();
      }

      const { assets, sender } = data;
      const assetsToSend = assets?.map((item) => {
        const { asset, amount, checked } = item as Required<Darwinia2EthereumTransfer['assets'][number]>;
        const { decimal = 'gwei', symbol = asset } = getChainInfo(chain.tokens, asset as string) as TokenChainInfo;
        const amountWei = checked ? toWei({ value: amount, unit: decimal }) : '0';

        return {
          asset: symbol,
          unit: decimal,
          amount: isRing(symbol) && new BN(amountWei).gte(fee) ? new BN(amountWei).sub(fee).toString() : amountWei,
        };
      });
      const value = { ...data, assets: assetsToSend };
      const beforeTransfer = applyModalObs({
        content: <TransferConfirm value={value} />,
      });
      const obs = issuingDarwiniaTokens(value, api);
      const afterTransfer = afterTx(TransferSuccess, {
        hashType: 'block',
        onDisappear: () => {
          form.setFieldsValue({
            [FORM_CONTROL.sender]: sender,
            [FORM_CONTROL.assets]: INITIAL_ASSETS,
          });
          getBalances(sender).then(setAvailableBalances);
        },
      })(value);

      return createTxWorkflow(beforeTransfer, obs, afterTransfer).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, api, chain.tokens, fee, form, getBalances, observer, setSubmit]);

  // eslint-disable-next-line complexity
  useEffect(() => {
    const defaultSender = (accounts && accounts[0] && accounts[0].address) || '';
    const { recipient: defaultRecipient } = getInfoFromHash();
    const { sender, recipient, assets } = form.getFieldsValue();
    const sendAccount = sender || defaultSender;

    form.setFieldsValue({
      [FORM_CONTROL.sender]: sendAccount,
      [FORM_CONTROL.assets]: assets || INITIAL_ASSETS,
      [FORM_CONTROL.recipient]: (recipient || defaultRecipient) ?? void 0,
    });

    const sub$$ = observe(setCrossChainFee, from(getFee(api)));
    const balance$$ = from(getBalances(sendAccount)).subscribe(setAvailableBalances);

    if (assets) {
      setCurAssets(assets);
    }

    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender });

    return () => {
      sub$$.unsubscribe();
      balance$$.unsubscribe();
    };
  }, [form, api, accounts, updateDeparture, observe, getBalances]);

  useEffect(() => {
    const recipient = form.getFieldValue(FORM_CONTROL.recipient);
    const sender = form.getFieldValue(FORM_CONTROL.sender);
    const { amount, checked } = currentAssets.find((item) => isRing(item.asset)) || {};

    if ([api, recipient, sender].some((item) => !item)) {
      return;
    }

    const extrinsic = api!.tx.balances.transfer(recipient, checked ? new BN(amount ?? 0) : new BN(0));
    const sub$$ = observe(
      setTxFee,
      from(extrinsic.paymentInfo(sender)).pipe(map((info) => new BN(info.partialFee ?? 0)))
    );

    return () => sub$$?.unsubscribe();
  }, [api, currentAssets, form, observe]);

  return (
    <>
      <PolkadotAccountsItem
        availableBalances={availableBalances}
        onChange={(value) => getBalances(value).then(setAvailableBalances)}
      />

      <RecipientItem
        form={form}
        transfer={transfer}
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
        className="mb-0"
      >
        <AssetGroup
          network={form.getFieldValue(FORM_CONTROL.transfer).from.name}
          balances={availableBalances}
          fee={fee}
          form={form}
          onChange={(value) => setCurAssets(value)}
        />
      </Form.Item>

      <Spin spinning={isFeeCalculating} size="small">
        <TransferInfo fee={fee} availableBalance={availableBalances} assets={currentAssets} />
      </Spin>
    </>
  );
}
