import { AccountData } from '@darwinia/types';
import { Descriptions, Form, Select } from 'antd';
import BN from 'bn.js';
import { capitalize, isNull } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FORM_CONTROL } from '../../config';
import { useAfterSuccess, useApi, useDeparture, useTx } from '../../hooks';
import {
  AvailableBalance,
  BridgeFormProps,
  DVMTransfer,
  Network,
  NoNullTransferNetwork,
  Substrate2SubstrateDVMTransfer,
  TokenChainInfo,
  TransferFormValues,
} from '../../model';
import {
  applyModalObs,
  createTxWorkflow,
  fromWei,
  issuingSubstrateToken,
  IssuingSubstrateToken,
  prettyNumber,
  toWei,
} from '../../utils';
import { Balance } from '../controls/Balance';
import { MaxBalance } from '../controls/MaxBalance';
import { PolkadotAccountsItem } from '../controls/PolkadotAccountsItem';
import { RecipientItem } from '../controls/RecipientItem';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Tx section-------------------------------------------------- */

// function backingLockSubstrate(value: IssuingSubstrateToken, after: AfterTxCreator, api: ApiPromise): Observable<Tx> {
//   const beforeTx = applyModalObs({
//     content: <TransferConfirm value={value} />,
//   });
//   const obs = issuingSubstrateToken(value, api);

//   return createTxWorkflow(beforeTx, obs, after);
// }

/* ----------------------------------------------Main Section-------------------------------------------------- */
interface TransferInfoProps {
  fee: BN;
  balance: BN | string | number;
  amount: string;
  tokenInfo: TokenChainInfo;
}

// eslint-disable-next-line complexity
function TransferInfo({ fee, balance, tokenInfo, amount }: TransferInfoProps) {
  const value = new BN(toWei({ value: amount || '0' }));

  if (!fee || !balance) {
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
          {fromWei({ value: value.sub(fee) })} {tokenInfo.symbol}
        </Descriptions.Item>
      )}
      <Descriptions.Item label={<Trans>Cross-chain Fee</Trans>} contentStyle={{ color: 'inherit' }}>
        <span className="flex items-center">
          {fromWei({ value: fee })} {tokenInfo.symbol}
        </span>
      </Descriptions.Item>
    </Descriptions>
  );
}

/**
 * @description test chain: pangoro -> pangolin dvm
 */
// eslint-disable-next-line complexity
export function Substrate2SubstrateDVM({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
    api,
    chain,
  } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const availableBalance = useMemo(() => availableBalances[0]?.max ?? null, [availableBalances]);
  const [curAmount, setCurAmount] = useState<string>(() => form.getFieldValue(FORM_CONTROL.amount) ?? '');
  const [fee] = useState<BN>(new BN(0));
  const { updateDeparture } = useDeparture();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess<TransferFormValues<Substrate2SubstrateDVMTransfer, NoNullTransferNetwork>>();
  const getBalances = useCallback<(acc: string) => Promise<AvailableBalance[]>>(
    async (account: string) => {
      if (!api || !chain.tokens.length) {
        return [];
      }

      const asset = form.getFieldValue(FORM_CONTROL.asset) as string;
      const { data } = await api.query.system.account(account);
      const { free, freeKton } = data as unknown as AccountData;
      const balance = /ring/i.test(asset) ? free : freeKton;

      return [
        {
          max: balance.toString(),
          asset,
          chainInfo: chain.tokens.find((item) => item.symbol === asset),
          checked: true,
        },
      ];
    },
    [api, chain.tokens, form]
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

  // eslint-disable-next-line complexity
  useEffect(() => {
    const sender = (accounts && accounts[0] && accounts[0].address) || '';

    form.setFieldsValue({
      [FORM_CONTROL.sender]: sender,
    });

    // const sub$$ = from(getFee(api)).subscribe((crossFee) => setFee(crossFee));

    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender });

    // return () => sub$$.unsubscribe();
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
        isDvm
      />

      {chain.tokens.length && (
        <Form.Item
          name={FORM_CONTROL.asset}
          initialValue={chain.tokens[0].symbol}
          label={t('Asset')}
          rules={[{ required: true }]}
        >
          <Select
            size="large"
            onChange={async () => {
              // TODO: check getBalances
              getBalances(form.getFieldValue(FORM_CONTROL.sender)).then(setAvailableBalances);
            }}
          >
            {chain.tokens.map(({ symbol }, index) => (
              <Select.Option value={symbol} key={symbol + '_' + index} disabled={/kton/i.test(symbol)}>
                <span>{symbol}</span>
                {/** FIXME: what's the name ? we can only get symbol, decimals and ss58Format from api properties  */}
                <sup className="ml-2 text-xs transform tra" title={t('name')}>
                  {t('{{network}} native token', {
                    network: capitalize(form.getFieldValue(FORM_CONTROL.transfer)?.from?.name ?? ''),
                  })}
                </sup>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      <Form.Item
        name={FORM_CONTROL.amount}
        validateFirst
        label={t('Amount')}
        rules={[
          { required: true },
          {
            validator(_, val: string) {
              return new BN(val).isZero() ? Promise.reject() : Promise.resolve();
            },
            message: t('The transfer amount must great than 0'),
          },
          {
            validator(_, val: string) {
              const max = new BN(availableBalance);
              const value = new BN(toWei({ value: val, unit: availableBalances[0].chainInfo?.decimal }));

              return value.gt(max) ? Promise.reject() : Promise.resolve();
            },
            message: t('The transfer amount must less or equal than the balance'),
          },
        ]}
      >
        <Balance
          size="large"
          placeholder={t('Balance {{balance}}', {
            balance: isNull(availableBalance)
              ? t('Searching')
              : fromWei({ value: availableBalance, unit: chain.tokens[0].decimal }, prettyNumber),
          })}
          className="flex-1"
          onChange={(val) => setCurAmount(val)}
        >
          <MaxBalance
            network={form.getFieldValue(FORM_CONTROL.transfer).from?.name as Network}
            onClick={() => {
              const { chainInfo, max } = availableBalances[0];
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
