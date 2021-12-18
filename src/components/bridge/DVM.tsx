import { Button, Descriptions, Form } from 'antd';
import BN from 'bn.js';
import { isNull } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Observable } from 'rxjs';
import { FORM_CONTROL, RegisterStatus } from '../../config';
import { Path } from '../../config/routes';
import { MemoedTokenInfo, useAfterSuccess, useApi, useMappedTokens, useTx } from '../../hooks';
import {
  BridgeFormProps,
  ChainConfig,
  DailyLimit,
  DVMToken,
  DVMTransfer,
  Erc20Token,
  EthereumChainDVMConfig,
  IssuingDVMToken,
  MappedToken,
  Network,
  NoNullTransferNetwork,
  RedeemDVMToken,
  RequiredPartial,
  TransferFormValues,
  Tx,
} from '../../model';
import {
  applyModalObs,
  approveToken,
  createTxWorkflow,
  fromWei,
  getAllowance,
  getNetworkMode,
  getUnit,
  insufficientBalanceRule,
  insufficientDailyLimit,
  isPolkadotNetwork,
  isValidAddress,
  prettyNumber,
  toWei,
} from '../../utils';
import { Balance } from '../controls/Balance';
import { Erc20Control } from '../controls/Erc20Control';
import { EthereumAccountItem } from '../controls/EthereumAccountItem';
import { MaxBalance } from '../controls/MaxBalance';
import { RecipientItem } from '../controls/RecipientItem';
import { ApproveConfirm } from '../modal/ApproveConfirm';
import { ApproveSuccess } from '../modal/ApproveSuccess';
import { Des } from '../modal/Des';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

export type ApproveValue = TransferFormValues<RequiredPartial<DVMTransfer, 'sender'>, NoNullTransferNetwork>;

interface DVMProps {
  tokenRegisterStatus: RegisterStatus;
  canRegister: boolean;
  approveOptions?: Record<string, string>;
  isDVM?: boolean;
  transform: (value: DVMToken) => Observable<Tx>;
  spenderResolver: (config: ChainConfig) => Promise<string>;
  getDailyLImit?: (token: MappedToken) => Promise<DailyLimit>;
  getFee?: (config: ChainConfig, token: MappedToken) => Promise<string>;
}

interface TransferInfoProps {
  amount: string;
  tokenInfo: MemoedTokenInfo | null;
  transfer: NoNullTransferNetwork<EthereumChainDVMConfig, ChainConfig>;
  dailyLimit: DailyLimit | null;
  fee: string | null;
}

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

// eslint-disable-next-line complexity
function TransferInfo({ tokenInfo, amount, transfer, dailyLimit, fee }: TransferInfoProps) {
  const [symbol, setSymbol] = useState('');
  const unit = tokenInfo ? getUnit(+tokenInfo.decimals) : 'ether';
  const value = new BN(toWei({ value: amount || '0', unit }));
  const isNoLimit = useMemo(() => {
    if (dailyLimit) {
      return new BN(dailyLimit.limit).isZero();
    }

    return false;
  }, [dailyLimit]);

  useEffect(() => {
    const { to: arrival } = transfer;
    const mode = getNetworkMode(arrival);
    (async () => {
      if (tokenInfo && isPolkadotNetwork(arrival.name) && mode === 'native') {
        const result = tokenInfo.symbol.replace('x', '');

        setSymbol(result);
      }
    })();
  }, [tokenInfo, transfer]);

  return (
    <Descriptions size="small" column={1} labelStyle={{ color: 'inherit' }} className="text-green-400">
      {!value.isZero() && (
        <Descriptions.Item label={<Trans>Recipient will receive</Trans>} contentStyle={{ color: 'inherit' }}>
          {fromWei({ value, unit })} {symbol}
        </Descriptions.Item>
      )}

      {!!fee && (
        <Descriptions.Item label={<Trans>Cross-chain Fee</Trans>} contentStyle={{ color: 'inherit' }}>
          <span className="flex items-center">
            {fee} {transfer.from.ethereumChain.nativeCurrency.symbol}
          </span>
        </Descriptions.Item>
      )}

      {!!dailyLimit && (
        <Descriptions.Item label={<Trans>Daily Limit</Trans>} contentStyle={{ color: 'inherit' }}>
          {isNoLimit ? (
            <Trans>No Limit</Trans>
          ) : (
            fromWei({ value: new BN(dailyLimit.limit).sub(new BN(dailyLimit.spentToday)), unit: 'gwei' }, prettyNumber)
          )}
        </Descriptions.Item>
      )}
    </Descriptions>
  );
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

// eslint-disable-next-line complexity
export function DVM({
  form,
  setSubmit,
  transform,
  spenderResolver,
  tokenRegisterStatus,
  canRegister,
  getDailyLImit,
  getFee,
  isDVM = true,
}: BridgeFormProps<DVMTransfer> & DVMProps) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
  } = useApi();
  const { total, tokens, refreshTokenBalance } = useMappedTokens(
    form.getFieldValue(FORM_CONTROL.transfer),
    tokenRegisterStatus
  );
  const [allowance, setAllowance] = useState(new BN(0));
  const [dailyLimit, setDailyLimit] = useState<DailyLimit | null>(null);
  const [selectedErc20, setSelectedErc20] = useState<Erc20Token | null>(null);
  const tokenInfo = useMemo(
    () => ({
      symbol: selectedErc20?.symbol ?? '',
      decimal: getUnit(+(selectedErc20?.decimals ?? '9')),
    }),
    [selectedErc20]
  );
  const availableBalance = useMemo(() => {
    return !selectedErc20
      ? null
      : fromWei({ value: selectedErc20.balance, unit: getUnit(+selectedErc20.decimals) }, prettyNumber);
  }, [selectedErc20]);
  const account = useMemo(() => {
    const acc = (accounts || [])[0];

    return isValidAddress(acc?.address, 'ethereum') ? acc.address : '';
  }, [accounts]);
  const [curAmount, setCurAmount] = useState<string>(() => form.getFieldValue(FORM_CONTROL.amount) ?? '');
  const unit = useMemo(() => (selectedErc20 ? getUnit(+selectedErc20.decimals) : 'ether'), [selectedErc20]);
  const { observer } = useTx();
  const { afterTx, afterApprove } = useAfterSuccess();
  const [fee, setFee] = useState<string>('');
  const refreshAllowance = useCallback(
    async (config: ChainConfig) => {
      const spender = await spenderResolver(config);

      return getAllowance(account, spender, selectedErc20).then((num) => {
        setAllowance(num);
        form.validateFields([FORM_CONTROL.amount]);
      });
    },
    [account, form, selectedErc20, spenderResolver]
  );

  useEffect(() => {
    if (getFee) {
      const departure = form.getFieldValue(FORM_CONTROL.transfer).from;

      getFee(departure, selectedErc20!).then(setFee);
    }
  }, [form, getFee, selectedErc20]);

  useEffect(() => {
    const fn = () => (data: RedeemDVMToken | IssuingDVMToken) => {
      const { amount } = data;
      const value = { ...data, amount: toWei({ value: data.amount, unit }) };

      const beforeTx = applyModalObs({
        content: (
          <TransferConfirm value={value}>
            <Des
              title={<Trans>Amount</Trans>}
              content={
                <span>
                  {amount} {value.asset.symbol}
                </span>
              }
            ></Des>
          </TransferConfirm>
        ),
      });
      const txObs = transform(value);

      return createTxWorkflow(
        beforeTx,
        txObs,
        afterTx(TransferSuccess, {
          onDisappear: () => {
            refreshTokenBalance(value.asset.address);
            refreshAllowance(value.transfer.from);
          },
          unit,
        })(value)
      ).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, observer, refreshAllowance, refreshTokenBalance, selectedErc20, setSubmit, transform, unit]);

  return (
    <>
      <EthereumAccountItem form={form} />

      <RecipientItem
        form={form}
        extraTip={t(
          'After the transaction is confirmed, the account cannot be changed. Please do not fill in the exchange account.'
        )}
        isDvm={isDVM}
      />

      <Form.Item
        name={FORM_CONTROL.asset}
        label={t('Asset')}
        extra={
          canRegister ? (
            <span className="inline-block mt-2">
              <Trans i18nKey="registrationTip">
                If you can not find the token you want to send in the list, highly recommended to
                <Link to={Path.register}> go to the registration page</Link>, where you will find it after completing
                the registration steps.
              </Trans>
            </span>
          ) : null
        }
        rules={[{ required: true }]}
        className="mb-2"
      >
        <Erc20Control
          tokens={tokens}
          total={total}
          onChange={async (erc20) => {
            setSelectedErc20(erc20);

            const spender = await spenderResolver(form.getFieldValue(FORM_CONTROL.transfer).from);
            const allow = await getAllowance(account, spender, erc20);

            setAllowance(allow);

            if (getDailyLImit && erc20?.address) {
              getDailyLImit(erc20).then(setDailyLimit);
            }
          }}
        />
      </Form.Item>

      <Form.Item
        name={FORM_CONTROL.amount}
        validateFirst
        label={t('Amount')}
        rules={[
          { required: true },
          insufficientBalanceRule({
            t,
            compared: selectedErc20?.balance,
            token: tokenInfo,
          }),
          insufficientDailyLimit({
            t,
            compared:
              dailyLimit && !new BN(dailyLimit.limit).isZero()
                ? new BN(dailyLimit.limit).sub(new BN(dailyLimit.spentToday)).toString()
                : // eslint-disable-next-line no-magic-numbers
                  Math.pow(10, 18).toString(),
            token: tokenInfo,
          }),
          {
            validator: (_, value: string) => {
              const val = new BN(toWei({ value }));

              return allowance.gte(val) ? Promise.resolve() : Promise.reject();
            },
            message: (
              <Trans i18nKey="approveBalanceInsufficient">
                Exceed the authorized amount, click to authorize more amount, or reduce the transfer amount
                <Button
                  onClick={async () => {
                    const transfer = form.getFieldValue(FORM_CONTROL.transfer) as NoNullTransferNetwork;
                    const value: Pick<ApproveValue, 'transfer' | 'sender' | 'asset'> = {
                      sender: account,
                      transfer,
                      asset: selectedErc20,
                    };
                    const spender = await spenderResolver(transfer.from);
                    const beforeTx = applyModalObs({
                      content: <ApproveConfirm value={value} />,
                    });
                    const txObs = approveToken({
                      sender: account,
                      transfer,
                      tokenAddress: selectedErc20?.address,
                      spender,
                    });

                    createTxWorkflow(
                      beforeTx,
                      txObs,
                      afterApprove(ApproveSuccess, { onDisappear: () => refreshAllowance(value.transfer.from) })(value)
                    ).subscribe(observer);
                  }}
                  type="link"
                  size="small"
                >
                  approve
                </Button>
              </Trans>
            ),
          },
        ]}
      >
        <Balance
          size="large"
          placeholder={t('Balance {{balance}}', {
            balance: isNull(availableBalance) ? t('Querying') : availableBalance,
          })}
          onChange={setCurAmount}
          className="flex-1"
        >
          <MaxBalance
            network={form.getFieldValue(FORM_CONTROL.transfer).from?.name as Network}
            onClick={() => {
              const amount = fromWei({ value: selectedErc20?.balance, unit }, prettyNumber);

              form.setFieldsValue({ [FORM_CONTROL.amount]: amount });
              setCurAmount(amount);
            }}
            size="large"
          />
        </Balance>
      </Form.Item>

      <TransferInfo
        amount={curAmount}
        tokenInfo={selectedErc20}
        transfer={form.getFieldValue(FORM_CONTROL.transfer)}
        fee={fee}
        dailyLimit={dailyLimit}
      />
    </>
  );
}
