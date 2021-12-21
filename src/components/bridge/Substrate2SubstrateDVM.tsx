import { Descriptions, Form, Progress, Select } from 'antd';
import ErrorBoundary from 'antd/lib/alert/ErrorBoundary';
import BN from 'bn.js';
import { capitalize } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { EMPTY, from, Subscription, switchMap, takeWhile } from 'rxjs';
import { abi, FORM_CONTROL, RegisterStatus } from '../../config';
import {
  useAfterSuccess,
  useApi,
  useDarwiniaAvailableBalances,
  useDeparture,
  useIsMounted,
  useMappedTokens,
  useTx,
} from '../../hooks';
import {
  AvailableBalance,
  BridgeFormProps,
  DailyLimit,
  EthereumChainDVMConfig,
  IssuingSubstrateToken,
  Network,
  NoNullTransferNetwork,
  Substrate2SubstrateDVMTransfer,
  TokenChainInfo,
  TransferFormValues,
} from '../../model';
import {
  amountLessThanFeeRule,
  applyModalObs,
  createTxWorkflow,
  entrance,
  fromWei,
  getS2SMappingParams,
  insufficientBalanceRule,
  insufficientDailyLimit,
  invalidFeeRule,
  isRing,
  issuingSubstrateToken,
  prettyNumber,
  toWei,
  waitUntilConnected,
  zeroAmountRule,
} from '../../utils';
import { Balance } from '../controls/Balance';
import { MaxBalance } from '../controls/MaxBalance';
import { PolkadotAccountsItem } from '../controls/PolkadotAccountsItem';
import { RecipientItem } from '../controls/RecipientItem';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Tx section-------------------------------------------------- */

interface TransferInfoProps {
  fee: BN | null;
  balance: BN | string | number;
  amount: string;
  tokenInfo: TokenChainInfo;
  dailyLimit: DailyLimit | null;
}

// eslint-disable-next-line complexity
function TransferInfo({ fee, balance, tokenInfo, amount, dailyLimit }: TransferInfoProps) {
  const unit = tokenInfo.decimal;
  const value = new BN(toWei({ value: amount || '0', unit }));
  const iterationCount = 5;

  if (!fee || !balance) {
    return null;
  }

  if (fee.lt(new BN(0))) {
    return (
      <p className="text-red-400 animate-pulse" style={{ animationIterationCount: iterationCount }}>
        <Trans>Bridge is not healthy, try it again later</Trans>
      </p>
    );
  }

  return (
    <Descriptions size="small" column={1} labelStyle={{ color: 'inherit' }} className="text-green-400">
      {value.gte(fee) && !value.isZero() && (
        <Descriptions.Item label={<Trans>Recipient will receive</Trans>} contentStyle={{ color: 'inherit' }}>
          {fromWei({ value: value.sub(fee), unit })} x{tokenInfo.symbol}
        </Descriptions.Item>
      )}
      <Descriptions.Item label={<Trans>Cross-chain Fee</Trans>} contentStyle={{ color: 'inherit' }}>
        <span className="flex items-center">
          {fromWei({ value: fee, unit })} {tokenInfo.symbol}
        </span>
      </Descriptions.Item>

      <Descriptions.Item label={<Trans>Daily Limit</Trans>} contentStyle={{ color: 'inherit' }}>
        {dailyLimit ? (
          fromWei({ value: new BN(dailyLimit.limit).sub(new BN(dailyLimit.spentToday)), unit: 'gwei' })
        ) : (
          <Trans>Querying</Trans>
        )}
      </Descriptions.Item>
    </Descriptions>
  );
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangoro -> pangolin dvm
 */
// eslint-disable-next-line complexity
export function Substrate2SubstrateDVM({ form, setSubmit }: BridgeFormProps<Substrate2SubstrateDVMTransfer>) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
    api,
    chain,
  } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const availableBalance = useMemo(() => availableBalances[0] ?? null, [availableBalances]);
  const [curAmount, setCurAmount] = useState<string>(() => form.getFieldValue(FORM_CONTROL.amount) ?? '');
  const [fee, setFee] = useState<BN | null>(null);
  const [dailyLimit, setDailyLimit] = useState<DailyLimit | null>(null);
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess<TransferFormValues<Substrate2SubstrateDVMTransfer, NoNullTransferNetwork>>();
  const getAvailableBalances = useDarwiniaAvailableBalances();
  const { tokens: targetChainTokens } = useMappedTokens(
    {
      from: form.getFieldValue([FORM_CONTROL.transfer, 'to']),
      to: form.getFieldValue([FORM_CONTROL.transfer, 'from']),
    },
    RegisterStatus.registered
  );
  const getBalances = useCallback<(acc: string) => Promise<AvailableBalance[]>>(
    async (account: string) => {
      if (!api || !chain.tokens.length || !form.getFieldValue(FORM_CONTROL.asset)) {
        return [];
      }

      const asset = form.getFieldValue(FORM_CONTROL.asset) as string;
      const balances = await getAvailableBalances(account);

      return balances.filter((item) => asset.toLowerCase().includes(item.asset.toLowerCase()));
    },
    [api, chain.tokens.length, form, getAvailableBalances]
  );
  const getDailyLimit = useCallback<(symbol: string) => Promise<DailyLimit | null>>(
    async (symbol: string) => {
      if (!targetChainTokens.length) {
        return null;
      }

      const arrival = form.getFieldValue(FORM_CONTROL.transfer).to as EthereumChainDVMConfig;
      const web3 = entrance.web3.getInstance(arrival.ethereumChain.rpcUrls[0]);
      const { mappingAddress } = await getS2SMappingParams(arrival.provider.rpc);
      const contract = new web3.eth.Contract(abi.S2SMappingTokenABI, mappingAddress);
      const token = targetChainTokens.find((item) => isRing(item.symbol));
      const ringAddress = token?.address;
      const tokenAddress = isRing(symbol) ? ringAddress : '';

      if (!tokenAddress) {
        return null;
      }

      const limit = await contract.methods.dailyLimit(tokenAddress).call();
      const spentToday = await contract.methods.spentToday(tokenAddress).call();

      return { limit, spentToday };
    },
    [form, targetChainTokens]
  );
  const isMounted = useIsMounted();

  useEffect(() => {
    const fn = () => (data: IssuingSubstrateToken) => {
      if (!api || !fee) {
        return EMPTY.subscribe();
      }

      const { sender, amount, asset } = data;
      const unit = chain.tokens.find((item) => item.symbol === asset)?.decimal || 'gwei';
      const value = {
        ...data,
        amount: new BN(toWei({ value: amount, unit })).sub(fee).toString(),
      };
      const beforeTransfer = applyModalObs({
        content: <TransferConfirm value={value} unit={unit} />,
      });
      const obs = issuingSubstrateToken(value, api, fee);
      const afterTransfer = afterTx(TransferSuccess, {
        hashType: 'block',
        onDisappear: () => {
          form.setFieldsValue({
            [FORM_CONTROL.sender]: sender,
          });
          getBalances(sender).then(setAvailableBalances);
        },
        unit,
      })(value);

      return createTxWorkflow(beforeTransfer, obs, afterTransfer).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, api, chain.tokens, fee, form, getBalances, observer, setAvailableBalances, setSubmit]);

  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    form.setFieldsValue({ [FORM_CONTROL.sender]: sender });

    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender });
  }, [form, api, accounts, updateDeparture]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const subscription = from(waitUntilConnected(api))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .pipe(switchMap(() => (api.rpc as any).fee.marketFee()))
      .subscribe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (res: any) => {
          const marketFee = res.amount?.toString();

          setFee(new BN(marketFee ?? -1)); // -1: fee market does not available
        }
      );

    return () => subscription?.unsubscribe();
  }, [api]);

  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';
    const subscription = from(getBalances(sender)).subscribe(setAvailableBalances);

    return () => subscription.unsubscribe();
  }, [accounts, getBalances, setAvailableBalances]);

  useEffect(() => {
    let sub$$: Subscription | null = null;
    let sub2$$: Subscription | null = null;

    if (chain.tokens.length) {
      const asset = chain.tokens[0].symbol;

      sub$$ = from(getBalances(form.getFieldValue(FORM_CONTROL.sender))).subscribe(setAvailableBalances);
      sub2$$ = from(getDailyLimit(asset)).subscribe(setDailyLimit);

      form.setFieldsValue({ [FORM_CONTROL.asset]: asset });
    }

    return () => {
      sub$$?.unsubscribe();
      sub2$$?.unsubscribe();
    };
  }, [chain.tokens, form, getBalances, getDailyLimit, setAvailableBalances, setDailyLimit]);

  return (
    <>
      <PolkadotAccountsItem
        availableBalances={availableBalances}
        onChange={(value) =>
          from(getBalances(value))
            .pipe(takeWhile(() => isMounted))
            .subscribe(setAvailableBalances)
        }
      />

      <RecipientItem
        form={form}
        extraTip={t(
          'After the transaction is confirmed, the account cannot be changed. Please do not fill in the exchange account.'
        )}
        isDvm
      />

      <Form.Item name={FORM_CONTROL.asset} label={t('Asset')} rules={[{ required: true }]}>
        <Select
          size="large"
          onChange={(value: string) => {
            from(getBalances(form.getFieldValue(FORM_CONTROL.sender)))
              .pipe(takeWhile(() => isMounted))
              .subscribe(setAvailableBalances);

            from(getDailyLimit(value))
              .pipe(takeWhile(() => isMounted))
              .subscribe(setDailyLimit);
          }}
          placeholder={t('Please select token to be transfer')}
        >
          {(chain.tokens || []).map(({ symbol }, index) => (
            <Select.Option value={symbol} key={symbol + '_' + index} disabled={/kton/i.test(symbol)}>
              <span>{symbol}</span>
              {/** FIXME: what's the name ? we can only get symbol, decimals and ss58Format from api properties  */}
              <sup className="ml-2 text-xs" title={t('name')}>
                {t('{{network}} native token', {
                  network: capitalize(form.getFieldValue(FORM_CONTROL.transfer)?.from?.name ?? ''),
                })}
              </sup>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {!chain.tokens.length && (
        <Progress
          percent={100}
          showInfo={false}
          status="active"
          strokeColor={{ from: '#5745de', to: '#ec3783' }}
          className="relative -top-6"
        />
      )}

      <Form.Item
        name={FORM_CONTROL.amount}
        validateFirst
        label={t('Amount')}
        rules={[
          { required: true },
          invalidFeeRule({ t, compared: fee }),
          zeroAmountRule({ t }),
          amountLessThanFeeRule({
            t,
            compared: fee ? fee.toString() : null,
            token: availableBalance?.chainInfo,
            asset: String(form.getFieldValue(FORM_CONTROL.asset)),
          }),
          insufficientBalanceRule({
            t,
            compared: availableBalance?.max,
            token: availableBalance?.chainInfo,
          }),
          insufficientDailyLimit({
            t,
            compared: new BN(dailyLimit?.limit ?? '0').sub(new BN(dailyLimit?.spentToday ?? '0')).toString(),
            token: availableBalance?.chainInfo,
          }),
        ]}
      >
        <Balance
          size="large"
          placeholder={t('Balance {{balance}}', {
            balance: !availableBalance
              ? t('Querying')
              : fromWei({ value: availableBalance?.max, unit: availableBalance?.chainInfo?.decimal }, prettyNumber),
          })}
          className="flex-1"
          onChange={(val) => setCurAmount(val)}
        >
          <MaxBalance
            network={form.getFieldValue(FORM_CONTROL.transfer).from?.name as Network}
            onClick={() => {
              const { chainInfo, max } = availableBalance;
              const amount = fromWei({ value: max, unit: chainInfo?.decimal });

              form.setFieldsValue({ [FORM_CONTROL.amount]: amount });
              setCurAmount(amount);
            }}
            size="large"
          />
        </Balance>
      </Form.Item>

      {!!availableBalances.length && availableBalances[0].chainInfo && (
        <ErrorBoundary>
          <TransferInfo
            fee={fee}
            balance={availableBalances[0].max}
            amount={curAmount}
            tokenInfo={availableBalances[0].chainInfo}
            dailyLimit={dailyLimit}
          />
        </ErrorBoundary>
      )}
    </>
  );
}
