import { QuestionCircleFilled } from '@ant-design/icons';
import { Button, Descriptions, Form, Input, Tooltip } from 'antd';
import { FormInstance, Rule } from 'antd/lib/form';
import BN from 'bn.js';
import { format } from 'date-fns';
import { TFunction } from 'i18next';
import { isNull } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { abi, FORM_CONTROL } from '../../config';
import { Path } from '../../config/routes';
import { useAfterSuccess, useApi, useDeparture, useTx } from '../../hooks';
import {
  BridgeFormProps,
  E2D,
  Erc20Token,
  NetConfig,
  Network,
  NoNullTransferNetwork,
  RequiredPartial,
  TransferFormValues,
  Tx,
} from '../../model';
import {
  AfterTxCreator,
  applyModalObs,
  approveRingToIssuing,
  createTxWorkflow,
  empty,
  fromWei,
  getInfoFromHash,
  getUnit,
  isValidAddress,
  prettyNumber,
  RedeemDeposit,
  redeemDeposit,
  redeemErc20,
  RedeemErc20,
  RedeemEth,
  redeemToken,
  toWei,
} from '../../utils';
import { Balance } from '../controls/Balance';
import { getDepositTimeRange } from '../controls/DepositItem';
import { Erc20Control } from '../controls/Erc20Control';
import { MaxBalance } from '../controls/MaxBalance';
import { RecipientItem } from '../controls/RecipientItem';
import { ApproveConfirm } from '../modal/ApproveConfirm';
import { ApproveSuccess } from '../modal/ApproveSuccess';
import { Des } from '../modal/Des';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

enum E2DAssetEnum {
  ring = 'ring',
  kton = 'kton',
  deposit = 'deposit',
}

interface AmountCheckInfo {
  amount?: string;
  fee: BN | null;
  balance: BN | null;
  ringBalance: BN | null;
  asset: 'ring' | 'kton' | string;
  form?: FormInstance<E2D>;
  t: TFunction;
}

const BN_ZERO = new BN(0);

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

async function getRingBalance(account: string, config: NetConfig): Promise<BN | null> {
  const web3 = new Web3(window.ethereum);

  try {
    const ringContract = new web3.eth.Contract(abi.tokenABI, config.tokenContract.ring);
    const ring = await ringContract.methods.balanceOf(account).call();

    return Web3.utils.toBN(ring);
  } catch (error) {
    console.error(
      '%c [ get ring balance in ethereum error ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      error.message
    );

    return null;
  }
}

async function getKtonBalance(account: string, config: NetConfig): Promise<BN | null> {
  const web3 = new Web3(window.ethereum);

  try {
    const ktonContract = new web3.eth.Contract(abi.tokenABI, config.tokenContract.kton);
    const kton = await ktonContract.methods.balanceOf(account).call();

    return web3.utils.toBN(kton);
  } catch (error) {
    console.error(
      '%c [ get kton balance in ethereum error ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      error.message
    );
  }

  return null;
}

async function getIssuingAllowance(from: string, config: NetConfig): Promise<BN> {
  const web3js = new Web3(window.ethereum || window.web3.currentProvider);
  const erc20Contract = new web3js.eth.Contract(abi.tokenABI, config.tokenContract.ring);
  const allowanceAmount = await erc20Contract.methods.allowance(from, config.tokenContract.issuingDarwinia).call();

  return Web3.utils.toBN(allowanceAmount || 0);
}

async function getFee(config: NetConfig): Promise<BN> {
  const web3js = new Web3(window.ethereum || window.web3.currentProvider);
  const erc20Contract = new web3js.eth.Contract(abi.registryABI, config.tokenContract.registryEth);
  const fee: number = await erc20Contract.methods
    .uintOf('0x55494e545f4252494447455f4645450000000000000000000000000000000000')
    .call();

  return web3js.utils.toBN(fee || 0);
}

function getAmountRules({ fee, ringBalance, balance, asset, form, t }: AmountCheckInfo): Rule[] {
  const required: Rule = { required: true };
  const isExit: (target: BN | null, name: string) => Rule = (target, name) => {
    const message = t('{{name}} query failed, please wait and try again', { name: t(name) });
    return {
      validator: () => (target ? Promise.resolve() : Promise.reject(message)),
      message,
    };
  };
  const isFeeExist = isExit(fee, 'Fee');
  const isBalance = isExit(balance, 'Balance');
  const isRingExist = isExit(ringBalance, 'RING');
  const ringEnoughMsg = t('The ring balance it not enough to cover the fee');
  const amountGtBalanceMsg = t('The transfer amount must less or equal than the balance');
  const ringGtThanFee: Rule = {
    validator: (_r, _v) => (ringBalance?.gte(fee!) ? Promise.resolve() : Promise.reject(ringEnoughMsg)),
    message: ringEnoughMsg,
  };
  const isLessThenMax = {
    validator: (_r: Rule, curVal: string) => {
      const value = new BN(Web3.utils.toWei(curVal));
      const { erc20 } = form?.getFieldsValue() || {};
      const maximum = erc20?.balance || BN_ZERO;

      return value.lte(maximum!) ? Promise.resolve() : Promise.reject(amountGtBalanceMsg);
    },
    message: amountGtBalanceMsg,
  };
  const commonRules: Rule[] = [required, isFeeExist, isBalance, isRingExist, ringGtThanFee, isLessThenMax];

  if (asset === E2DAssetEnum.ring) {
    const gtThanFee: Rule = {
      validator: (_r, curVal: string) => {
        const value = new BN(Web3.utils.toWei(curVal));
        return value.gte(fee!) ? Promise.resolve() : Promise.reject();
      },
      message: t('The transfer amount is not enough to cover the fee'),
    };

    return [...commonRules, gtThanFee];
  }

  return commonRules;
}

// eslint-disable-next-line complexity
function TransferInfo({ fee, balance, ringBalance, amount, asset, t }: AmountCheckInfo) {
  const value = new BN(toWei({ value: amount || '0' }));

  if (!fee || !ringBalance || !balance) {
    return (
      // eslint-disable-next-line no-magic-numbers
      <p className="text-red-400 animate-pulse px-2" style={{ animationIterationCount: !fee ? 'infinite' : 5 }}>
        {t('Transfer information querying')}
      </p>
    );
  }

  return (
    <Descriptions size="small" column={1} labelStyle={{ color: 'inherit' }} className="text-green-400 px-2">
      {asset === E2DAssetEnum.ring && value.gte(fee) && (
        <Descriptions.Item label={<Trans>Recipient will receive</Trans>} contentStyle={{ color: 'inherit' }}>
          {fromWei({ value: value.sub(fee) })} RING
        </Descriptions.Item>
      )}
      <Descriptions.Item label={<Trans>Cross-chain Fee</Trans>} contentStyle={{ color: 'inherit' }}>
        <span className="flex items-center">
          {fromWei({ value: fee })} RING
          <Tooltip
            title={
              <ul className="pl-4 list-disc">
                <li>
                  <Trans>Fee paid per transaction, event if the asset type is not RING</Trans>
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

type ApproveValue = TransferFormValues<RequiredPartial<E2D, 'sender'>, NoNullTransferNetwork>;

function createApproveRingTx(value: ApproveValue, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <ApproveConfirm value={value} />,
  });
  const txObs = approveRingToIssuing(value);

  return createTxWorkflow(beforeTx, txObs, after);
}

function createCrossTokenTx(value: RedeemEth, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <TransferConfirm value={value} />,
  });
  const txObs = redeemToken(value);

  return createTxWorkflow(beforeTx, txObs, after);
}

function createCrossDepositTx(value: RedeemDeposit, after: AfterTxCreator): Observable<Tx> {
  const DATE_FORMAT = 'yyyy/MM/dd';
  const { start, end } = getDepositTimeRange(value.deposit);
  const beforeTx = applyModalObs({
    content: (
      <TransferConfirm value={value}>
        <Des
          title={<Trans>Deposit</Trans>}
          content={
            <span>
              {value.deposit.amount} RING
              <span>
                ({<Trans>Deposit ID</Trans>}: {value.deposit.deposit_id} {<Trans>Time</Trans>}:{' '}
                {format(start, DATE_FORMAT)} - {format(end, DATE_FORMAT)})
              </span>
            </span>
          }
        ></Des>
      </TransferConfirm>
    ),
  });
  const txObs = redeemDeposit(value);

  return createTxWorkflow(beforeTx, txObs, after);
}

function createErc20Tx(value: RedeemErc20, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: (
      <TransferConfirm value={value}>
        <Des
          title={<Trans>Amount</Trans>}
          content={
            <span>
              {value.amount} {value.erc20.symbol}
            </span>
          }
        ></Des>
      </TransferConfirm>
    ),
  });
  const txObs = redeemErc20(value);

  return createTxWorkflow(beforeTx, txObs, after);
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

// eslint-disable-next-line complexity
export function Ethereum2DarwiniaDVM({ form, setSubmit }: BridgeFormProps<E2D>) {
  const { t } = useTranslation();
  const [allowance, setAllowance] = useState(BN_ZERO);
  const [max, setMax] = useState<BN | null>(null);
  const [fee, setFee] = useState<BN | null>(null);
  const [ringBalance, setRingBalance] = useState<BN | null>(null);
  const [selectedToken, setSelectedToken] = useState<Erc20Token | null>(null);
  const [curAmount, setCurAmount] = useState<string>(() => form.getFieldValue(FORM_CONTROL.amount) ?? '');
  const [removedDepositIds, setRemovedDepositIds] = useState<number[]>([]);
  const [updateErc20, setUpdateErc20] = useState<(addr: string) => Promise<void>>(() => Promise.resolve());
  const { accounts } = useApi();
  const { observer } = useTx();
  const { updateDeparture } = useDeparture();
  const { afterTx } = useAfterSuccess();
  const account = useMemo(() => {
    const acc = (accounts || [])[0];

    return isValidAddress(acc?.address, 'ethereum') ? acc.address : '';
  }, [accounts]);
  const availableBalance = useMemo(() => {
    return !selectedToken
      ? null
      : fromWei({ value: selectedToken.balance, unit: getUnit(+selectedToken.decimals) }, prettyNumber);
  }, [selectedToken]);
  const amountRules = useMemo(
    () => getAmountRules({ fee, balance: max, ringBalance, asset: selectedToken?.name ?? '', form, t }),
    [fee, form, max, ringBalance, selectedToken, t]
  );
  const refreshAllowance = useCallback(
    (value: RedeemEth | ApproveValue) =>
      getIssuingAllowance(account, value.transfer.from).then((num) => {
        setAllowance(num);
        form.validateFields([FORM_CONTROL.amount]);
      }),
    [account, form]
  );

  const refreshBalance = useCallback(
    (value: RedeemEth | ApproveValue) => {
      if (value.erc20) {
        updateErc20(value.erc20!.address);
      }

      if (value.asset === E2DAssetEnum.kton) {
        getKtonBalance(account, value.transfer.from).then((balance) => setMax(balance));
      }

      getRingBalance(account, value.transfer.from).then((balance) => {
        if (value.asset === E2DAssetEnum.ring) {
          setMax(balance);
        }

        setRingBalance(balance);
      });
      refreshAllowance(value);
    },
    [account, refreshAllowance, updateErc20]
  );

  const refreshDeposit = useCallback(
    (value: RedeemDeposit) => {
      setRemovedDepositIds(() => [...removedDepositIds, value.deposit.deposit_id]);
      getRingBalance(account, value.transfer.from).then((balance) => setRingBalance(balance));
    },
    [account, removedDepositIds]
  );

  const updateSubmit = useCallback(
    (curAsset: E2DAssetEnum | Erc20Token | null) => {
      let fn = empty;

      if (curAsset === null) {
        fn = () => (value: RedeemErc20) =>
          createErc20Tx(value, afterTx(TransferSuccess, { onDisappear: refreshBalance })(value)).subscribe(observer);
      } else if (curAsset === E2DAssetEnum.deposit) {
        fn = () => (value: RedeemDeposit) =>
          createCrossDepositTx(
            value,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            afterTx(TransferSuccess, { onDisappear: refreshDeposit as unknown as any })(value)
          ).subscribe(observer);
      } else {
        fn = () => (value: RedeemEth) => {
          const { amount, asset: iAsset, ...rest } = value;
          const actual = {
            ...rest,
            asset: iAsset,
            amount:
              iAsset === E2DAssetEnum.ring
                ? fromWei({
                    value: Web3.utils
                      .toBN(toWei({ value: amount }))
                      .sub(fee!)
                      .toString(),
                  })
                : amount,
          };

          return createCrossTokenTx(
            actual,
            afterTx(TransferSuccess, { onDisappear: refreshBalance })(actual)
          ).subscribe(observer);
        };
      }

      setSubmit(fn);
    },
    [afterTx, fee, observer, refreshBalance, refreshDeposit, setSubmit]
  );

  // eslint-disable-next-line complexity
  useEffect(() => {
    if (!account) {
      return;
    }

    const netConfig: NetConfig = form.getFieldValue(FORM_CONTROL.transfer).from;
    const { recipient } = getInfoFromHash();

    form.setFieldsValue({
      [FORM_CONTROL.recipient]: recipient ?? '',
      [FORM_CONTROL.sender]: account,
    });

    Promise.all([getRingBalance(account, netConfig), getFee(netConfig), getIssuingAllowance(account, netConfig)]).then(
      ([balance, crossFee, allow]) => {
        setRingBalance(balance);
        setMax(balance);
        setFee(crossFee);
        setAllowance(allow);
      }
    );
    updateDeparture({ from: netConfig || undefined, sender: form.getFieldValue(FORM_CONTROL.sender) });
  }, [account, form, updateDeparture]);

  useEffect(() => {
    updateSubmit(selectedToken);
  }, [selectedToken, updateSubmit]);

  return (
    <>
      <Form.Item name={FORM_CONTROL.sender} className="hidden" rules={[{ required: true }]}>
        <Input disabled value={account} />
      </Form.Item>
      <RecipientItem
        form={form}
        extraTip={
          <span className="inline-block mt-2 px-2">
            <Trans>
              Please be sure to fill in the real Darwinia mainnet account, and keep the account recovery files such as
              mnemonic properly.
            </Trans>
          </span>
        }
        isDvm={true}
      />

      <Form.Item
        name={FORM_CONTROL.asset}
        label={t('Asset')}
        extra={
          <span className="inline-block mt-2 px-2">
            <Trans i18nKey="registrationTip">
              If you can not find the token you want to send in the list, highly recommended to
              <Link to={Path.register}> go to the registration page</Link>, where you will find it after completing the
              registration steps.
            </Trans>
          </span>
        }
        rules={[{ required: true }]}
        className="mb-2"
      >
        <Erc20Control
          network={form.getFieldValue(FORM_CONTROL.transfer).from.name}
          onChange={(erc20) => {
            setSelectedToken(erc20);
          }}
          updateBalance={setUpdateErc20}
        />
      </Form.Item>

      <Form.Item
        name={FORM_CONTROL.amount}
        validateFirst
        label={t('Amount')}
        rules={[
          ...amountRules,
          {
            validator: (_, value: string) => {
              const val =
                form.getFieldValue(FORM_CONTROL.asset) !== E2DAssetEnum.ring
                  ? fee ?? BN_ZERO
                  : new BN(Web3.utils.toWei(value));

              return allowance.gte(val) ? Promise.resolve() : Promise.reject();
            },

            message: (
              <div className="my-2">
                <span className="mr-4">
                  {t('Exceed the authorized amount, click to authorize more amount, or reduce the transfer amount')}
                </span>
                <Button
                  onClick={() => {
                    const value = {
                      sender: account,
                      transfer: form.getFieldValue(FORM_CONTROL.transfer),
                    };

                    createApproveRingTx(
                      value,
                      afterTx(ApproveSuccess, { onDisappear: refreshAllowance })(value)
                    ).subscribe(observer);
                  }}
                  size="small"
                >
                  {t('Approve')}
                </Button>
              </div>
            ),
          },
        ]}
      >
        <Balance
          size="large"
          placeholder={t('Balance {{balance}}', {
            balance: isNull(availableBalance) ? t('Searching') : availableBalance,
          })}
          className="flex-1"
          onChange={(val) => setCurAmount(val)}
        >
          <MaxBalance
            network={form.getFieldValue(FORM_CONTROL.transfer).from?.name as Network}
            onClick={() => {
              const val = selectedToken?.balance || max;
              const unit = getUnit(+(selectedToken?.decimals ?? '18')) ?? 'ether';
              const amount = fromWei({ value: val, unit }, prettyNumber);

              form.setFieldsValue({ [FORM_CONTROL.amount]: amount });
              setCurAmount(amount);
            }}
            size="large"
          />
        </Balance>
      </Form.Item>

      <Form.Item className="mb-0">
        <TransferInfo
          fee={fee}
          ringBalance={ringBalance}
          balance={max}
          asset={selectedToken?.name ?? ''}
          amount={curAmount}
          t={t}
        />
      </Form.Item>
    </>
  );
}
