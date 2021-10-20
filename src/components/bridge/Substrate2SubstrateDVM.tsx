import { Descriptions, Form, Progress, Select } from 'antd';
import BN from 'bn.js';
import { capitalize } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FORM_CONTROL } from '../../config';
import { useAfterSuccess, useApi, useDarwiniaAvailableBalances, useDeparture, useTx } from '../../hooks';
import {
  AvailableBalance,
  BridgeFormProps,
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
  fromWei,
  insufficientBalanceRule,
  issuingSubstrateToken,
  ISSUING_SUBSTRATE_FEE,
  prettyNumber,
  toWei,
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
  fee: BN;
  balance: BN | string | number;
  amount: string;
  tokenInfo: TokenChainInfo;
}

// eslint-disable-next-line complexity
function TransferInfo({ fee, balance, tokenInfo, amount }: TransferInfoProps) {
  const unit = tokenInfo.decimal;
  const value = new BN(toWei({ value: amount || '0', unit }));

  if (!fee || fee.isZero() || !balance) {
    return (
      // eslint-disable-next-line no-magic-numbers
      <p className="text-red-400 animate-pulse" style={{ animationIterationCount: !fee ? 'infinite' : 5 }}>
        <Trans>Transfer information querying</Trans>
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
  const [fee] = useState<BN>(new BN(ISSUING_SUBSTRATE_FEE));
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess<TransferFormValues<Substrate2SubstrateDVMTransfer, NoNullTransferNetwork>>();
  const getAvailableBalances = useDarwiniaAvailableBalances();
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

  useEffect(() => {
    const fn = () => (data: IssuingSubstrateToken) => {
      const { sender, amount, asset } = data;
      const unit = chain.tokens.find((item) => item.symbol === asset)?.decimal || 'gwei';
      const beforeTx = applyModalObs({
        content: <TransferConfirm value={data} />,
      });
      const obs = issuingSubstrateToken({ ...data, amount: toWei({ value: amount, unit }) }, api!);
      const after = afterTx(TransferSuccess, {
        hashType: 'block',
        onDisappear: () => {
          form.setFieldsValue({
            [FORM_CONTROL.sender]: sender,
          });
          getBalances(sender).then(setAvailableBalances);
        },
      })(data);

      return createTxWorkflow(beforeTx, obs, after).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, api, chain.tokens, form, getBalances, observer, setSubmit]);

  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    form.setFieldsValue({ [FORM_CONTROL.sender]: sender });

    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender });
  }, [form, api, accounts, updateDeparture]);

  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    getBalances(sender).then(setAvailableBalances);
  }, [accounts, getBalances]);

  useEffect(() => {
    if (chain.tokens.length) {
      form.setFieldsValue({ [FORM_CONTROL.asset]: chain.tokens[0].symbol });
      getBalances(form.getFieldValue(FORM_CONTROL.sender)).then(setAvailableBalances);
    }
  }, [chain.tokens, form, getBalances]);

  return (
    <>
      <PolkadotAccountsItem
        availableBalances={availableBalances}
        onChange={(value) => getBalances(value).then(setAvailableBalances)}
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
          onChange={() => {
            getBalances(form.getFieldValue(FORM_CONTROL.sender)).then(setAvailableBalances);
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
          zeroAmountRule({ t }),
          amountLessThanFeeRule({
            t,
            compared: fee.toString(),
            token: availableBalance?.chainInfo,
            asset: String(form.getFieldValue(FORM_CONTROL.asset)),
          }),
          insufficientBalanceRule({
            t,
            compared: availableBalance?.max,
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
        <TransferInfo
          fee={fee}
          balance={availableBalances[0].max}
          amount={curAmount}
          tokenInfo={availableBalances[0].chainInfo}
        />
      )}
    </>
  );
}
