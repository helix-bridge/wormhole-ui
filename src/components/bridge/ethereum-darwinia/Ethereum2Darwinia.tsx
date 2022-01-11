import { QuestionCircleFilled } from '@ant-design/icons';
import { Button, Descriptions, Form, Input, Progress, Select, Tooltip } from 'antd';
import { FormInstance, Rule } from 'antd/lib/form';
import BN from 'bn.js';
import { format } from 'date-fns';
import { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { abi, FORM_CONTROL } from '../../../config';
import { useAfterSuccess, useApi, useDeparture, useTx } from '../../../hooks';
import {
  CrossChainComponentProps,
  CrossChainPayload,
  Erc20Token,
  Ethereum2DarwiniaPayload,
  EthereumDarwiniaBridgeConfig,
  Network,
  RedeemDarwiniaToken,
  RedeemDeposit,
  Tx,
} from '../../../model';
import {
  AfterTxCreator,
  applyModalObs,
  approveToken,
  createTxWorkflow,
  entrance,
  fromWei,
  getBridge,
  getInfoFromHash,
  isDeposit,
  isKton,
  isRing,
  isValidAddress,
  prettyNumber,
  redeemDarwiniaToken,
  redeemDeposit,
  toWei,
} from '../../../utils';
import { getMappedTokenMeta, getTokenBalance, TokenCache } from '../../../utils/erc20/meta';
import { Balance } from '../../controls/Balance';
import { DepositItem, getDepositTimeRange } from '../../controls/DepositItem';
import { MaxBalance } from '../../controls/MaxBalance';
import { RecipientItem } from '../../controls/RecipientItem';
import { ApproveConfirm } from '../../modal/ApproveConfirm';
import { ApproveSuccess } from '../../modal/ApproveSuccess';
import { Des } from '../../modal/Des';
import { TransferConfirm } from '../../modal/TransferConfirm';
import { TransferSuccess } from '../../modal/TransferSuccess';

interface AmountCheckInfo {
  amount?: string;
  fee: BN | null;
  balance: BN | null;
  ringBalance: BN | null;
  asset: string;
  form?: FormInstance<Ethereum2DarwiniaPayload>;
  t: TFunction;
}

const BN_ZERO = new BN(0);

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

async function queryTokenMeta(ringContract: string, ktonContract: string) {
  const ringMeta = await getMappedTokenMeta(ringContract);
  const ktonMeta = await getMappedTokenMeta(ktonContract);

  return [ringMeta, ktonMeta];
}

async function getIssuingAllowance(from: string, ringContract: string, issuingContract: string): Promise<BN> {
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const contract = new web3.eth.Contract(abi.tokenABI, ringContract);
  const allowanceAmount = await contract.methods.allowance(from, issuingContract).call();

  return Web3.utils.toBN(allowanceAmount || 0);
}

async function getFee(feeContract: string): Promise<BN> {
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const contract = new web3.eth.Contract(abi.registryABI, feeContract);
  const fee: number = await contract.methods
    .uintOf('0x55494e545f4252494447455f4645450000000000000000000000000000000000')
    .call();

  return web3.utils.toBN(fee || 0);
}

function getAmountRules({ fee, ringBalance, balance, asset, t }: AmountCheckInfo): Rule[] {
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
  const amountGtBalanceMsg = t('Insufficient balance');
  const ringGtThanFee: Rule = {
    validator: (_r, _v) => (ringBalance?.gte(fee!) ? Promise.resolve() : Promise.reject(ringEnoughMsg)),
    message: ringEnoughMsg,
  };
  const isLessThenMax = {
    validator: (_r: Rule, curVal: string) => {
      const value = new BN(toWei({ value: curVal }));
      const maximum = balance;

      return value.lte(maximum!) ? Promise.resolve() : Promise.reject(amountGtBalanceMsg);
    },
    message: amountGtBalanceMsg,
  };
  const commonRules: Rule[] = [required, isFeeExist, isBalance, isRingExist, ringGtThanFee, isLessThenMax];

  if (isRing(asset)) {
    const gtThanFee: Rule = {
      validator: (_r, curVal: string) => {
        const value = new BN(toWei({ value: curVal }));
        return value.gte(fee!) ? Promise.resolve() : Promise.reject();
      },
      message: t('The transfer amount is not enough to cover the fee'),
    };

    return [...commonRules, gtThanFee];
  }

  if (isDeposit(asset)) {
    return [required, isFeeExist, isRingExist, ringGtThanFee];
  }

  return commonRules;
}

// eslint-disable-next-line complexity
function TransferInfo({ fee, balance, ringBalance, amount, asset, t }: AmountCheckInfo) {
  const value = new BN(toWei({ value: amount || '0' }));

  if (!fee || !ringBalance || !balance) {
    return (
      // eslint-disable-next-line no-magic-numbers
      <p className="text-red-400 animate-pulse" style={{ animationIterationCount: !fee ? 'infinite' : 5 }}>
        {t('Transfer information querying')}
      </p>
    );
  }

  return (
    <Descriptions size="small" column={1} labelStyle={{ color: 'inherit' }} className="text-green-400">
      {isRing(asset) && value.gte(fee) && (
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
                  <Trans>Fee paid per transaction</Trans>
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

type ApproveValue = CrossChainPayload<Ethereum2DarwiniaPayload>;

function createApproveRingTx(value: Pick<ApproveValue, 'direction' | 'sender'>, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <ApproveConfirm value={value} />,
  });
  const {
    sender,
    direction: { from, to },
  } = value;
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>([from, to]);
  const { ring: tokenAddress, issuing: spender } = bridge.config.contracts;
  const txObs = approveToken({
    sender,
    spender,
    tokenAddress,
  });

  return createTxWorkflow(beforeTx, txObs, after);
}

function createCrossTokenTx(value: RedeemDarwiniaToken, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <TransferConfirm value={value} />,
  });
  const txObs = redeemDarwiniaToken(value);

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

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: ropsten -> pangolin
 */
// eslint-disable-next-line complexity
export function Ethereum2Darwinia({ form, setSubmit, direction }: CrossChainComponentProps<Ethereum2DarwiniaPayload>) {
  const { t } = useTranslation();
  const [allowance, setAllowance] = useState(BN_ZERO);
  const [max, setMax] = useState<BN | null>(null);
  const [fee, setFee] = useState<BN | null>(null);
  const [ringBalance, setRingBalance] = useState<BN | null>(null);
  const [isBalanceQuerying, setIsBalanceQuerying] = useState<boolean>(true);
  const [curAmount, setCurAmount] = useState<string>(() => form.getFieldValue(FORM_CONTROL.amount) ?? '');
  const [asset, setAsset] = useState<string>(() => form.getFieldValue(FORM_CONTROL.asset) ?? 'RING');
  const [removedDepositIds, setRemovedDepositIds] = useState<number[]>([]);
  const [tokens, setTokens] = useState<TokenCache[]>([]);
  const {
    connection: { accounts },
  } = useApi();
  const { observer } = useTx();
  const { updateDeparture } = useDeparture();
  const { afterTx, afterApprove } = useAfterSuccess<ApproveValue>();
  const account = useMemo(() => {
    const acc = (accounts || [])[0];

    return isValidAddress(acc?.address, 'ethereum') ? acc.address : '';
  }, [accounts]);
  const availableBalance = useMemo(() => {
    return max === null ? null : fromWei({ value: max }, prettyNumber);
  }, [max]);
  const amountRules = useMemo(
    () => getAmountRules({ fee, balance: max, ringBalance, asset, t }),
    [asset, fee, max, ringBalance, t]
  );
  const contracts = useMemo(() => {
    const bridget = getBridge<EthereumDarwiniaBridgeConfig>(direction);

    return bridget.config.contracts;
  }, [direction]);

  const refreshAllowance = useCallback(
    (value: RedeemDarwiniaToken | ApproveValue) => {
      const bridge = getBridge<EthereumDarwiniaBridgeConfig>(value.direction);
      const { ring, issuing } = bridge.config.contracts;

      getIssuingAllowance(account, ring, issuing).then((num) => {
        setAllowance(num);
        form.validateFields([FORM_CONTROL.amount]);
      });
    },
    [account, form]
  );

  const refreshBalance = useCallback(
    (value: RedeemDarwiniaToken | ApproveValue) => {
      const { kton, ring } = contracts;

      if (isKton(value.asset)) {
        getTokenBalance(kton, account, false).then((balance) => setMax(balance));
      }

      // always need to refresh ring balance, because of it is a fee token
      getTokenBalance(ring, account, false).then((balance) => {
        if (isRing(value.asset)) {
          setMax(balance);
        }

        setRingBalance(balance);
      });
      refreshAllowance(value);
    },
    [account, contracts, refreshAllowance]
  );

  const refreshDeposit = useCallback(
    (value: RedeemDeposit) => {
      const { ring } = contracts;

      setRemovedDepositIds(() => [...removedDepositIds, value.deposit.deposit_id]);
      getTokenBalance(ring, account, false).then((balance) => setRingBalance(balance));
    },
    [account, contracts, removedDepositIds]
  );

  const updateSubmit = useCallback(
    (curAsset: string | Erc20Token | null) => {
      if (isDeposit(curAsset as string)) {
        const fn = () => (value: RedeemDeposit) =>
          createCrossDepositTx(
            value,
            afterTx(TransferSuccess, { onDisappear: refreshDeposit as unknown as never })(value)
          ).subscribe(observer);

        setSubmit(fn);
      } else {
        const fn = () => (value: RedeemDarwiniaToken) => {
          const { amount, asset: iAsset, ...rest } = value;
          const sum = Web3.utils.toBN(toWei({ value: amount }));
          const actual = {
            ...rest,
            asset: iAsset,
            amount: isRing(iAsset) ? sum.sub(fee!).toString() : sum.toString(),
          };

          return createCrossTokenTx(
            actual,
            afterTx(TransferSuccess, { onDisappear: refreshBalance })(actual)
          ).subscribe(observer);
        };

        setSubmit(fn);
      }
    },
    [afterTx, fee, observer, refreshBalance, refreshDeposit, setSubmit]
  );

  // eslint-disable-next-line complexity
  useEffect(() => {
    if (!account) {
      return;
    }

    const { from } = direction;
    const { ring, kton, fee: feeContract, issuing } = contracts;
    const { recipient } = getInfoFromHash();

    form.setFieldsValue({
      [FORM_CONTROL.recipient]: recipient ?? '',
      [FORM_CONTROL.sender]: account,
    });

    Promise.all([
      getTokenBalance(ring, account, false),
      getFee(feeContract),
      getIssuingAllowance(account, ring, issuing),
      queryTokenMeta(ring, kton),
    ]).then(([balance, crossFee, allow, tokenMeta]) => {
      setRingBalance(balance);
      setMax(balance);
      setFee(crossFee);
      setAllowance(allow);
      setIsBalanceQuerying(false);
      setTokens(tokenMeta);
    });
    updateDeparture({ from, sender: form.getFieldValue(FORM_CONTROL.sender) });
  }, [account, contracts, direction, form, updateDeparture]);

  useEffect(() => {
    updateSubmit(asset);
  }, [asset, updateSubmit]);

  return (
    <>
      <Form.Item name={FORM_CONTROL.sender} className="hidden" rules={[{ required: true }]}>
        <Input disabled value={account} />
      </Form.Item>

      <RecipientItem
        form={form}
        direction={direction}
        extraTip={
          <span className="inline-block mt-2 px-2">
            <Trans>
              Please be sure to fill in the real Darwinia mainnet account, and keep the account recovery files such as
              mnemonic properly.
            </Trans>
          </span>
        }
      />

      <Form.Item name={FORM_CONTROL.asset} initialValue="ring" label={t('Asset')}>
        <Select
          size="large"
          placeholder="Select Assets"
          onChange={async (value: string) => {
            form.setFieldsValue({ amount: '' });

            let balance: BN | null = null;
            const { ring, kton } = contracts;

            setIsBalanceQuerying(true);

            if (isRing(value)) {
              balance = await getTokenBalance(ring, account, false);

              setRingBalance(balance);
            }

            if (isKton(value)) {
              balance = await getTokenBalance(kton, account, false);
            }

            setAsset(value);
            setMax(balance);
            setIsBalanceQuerying(false);
          }}
        >
          {tokens.map(({ symbol, address, name }) => (
            <Select.Option value={symbol.toLowerCase()} key={address}>
              <span>{symbol}</span>
              <sup className="ml-2 text-xs" title={t('name')}>
                {name}
              </sup>
            </Select.Option>
          ))}
          <Select.Option value="deposit" className="uppercase">
            {t('Deposit')}
          </Select.Option>
        </Select>
      </Form.Item>
      {!tokens.length && (
        <Progress
          percent={100}
          showInfo={false}
          status="active"
          strokeColor={{ from: '#5745de', to: '#ec3783' }}
          className="relative -top-6"
        />
      )}

      {isDeposit(asset) ? (
        <DepositItem address={account} direction={direction} removedIds={removedDepositIds} rules={amountRules} />
      ) : (
        <Form.Item
          name={FORM_CONTROL.amount}
          validateFirst
          label={t('Amount')}
          rules={[
            ...amountRules,
            {
              // eslint-disable-next-line complexity
              validator: (_, value: string) => {
                const val = !isRing(form.getFieldValue(FORM_CONTROL.asset)) ? fee ?? BN_ZERO : new BN(toWei({ value }));

                return allowance.gte(val) ? Promise.resolve() : Promise.reject();
              },

              message: (
                <Trans i18nKey="approveBalanceInsufficient">
                  Exceed the authorized amount, click to authorize more amount, or reduce the transfer amount
                  <Button
                    onClick={() => {
                      const value = {
                        sender: account,
                        direction,
                      };

                      createApproveRingTx(
                        value,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        afterApprove(ApproveSuccess, { onDisappear: refreshAllowance })(value as unknown as any)
                      ).subscribe(observer);
                    }}
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
              balance: isBalanceQuerying ? t('Querying') : availableBalance,
            })}
            className="flex-1"
            onChange={(val) => setCurAmount(val)}
          >
            <MaxBalance
              network={form.getFieldValue(FORM_CONTROL.direction).from?.name as Network}
              onClick={() => {
                const amount = fromWei({ value: max, unit: 'ether' }, prettyNumber);

                form.setFieldsValue({ [FORM_CONTROL.amount]: amount });
                setCurAmount(amount);
              }}
              size="large"
            />
          </Balance>
        </Form.Item>
      )}

      <Form.Item className="mb-0">
        <TransferInfo fee={fee} ringBalance={ringBalance} balance={max} asset={asset} amount={curAmount} t={t} />
      </Form.Item>
    </>
  );
}