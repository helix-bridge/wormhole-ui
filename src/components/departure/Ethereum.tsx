import { LockOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select } from 'antd';
import BN from 'bn.js';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { abi, FORM_CONTROL } from '../../config';
import { useAfterSuccess, useApi, useTx } from '../../hooks';
import {
  BridgeFormProps,
  E2D,
  NetConfig,
  Network,
  NoNullTransferNetwork,
  RequiredPartial,
  TransferFormValues,
  TransferNetwork,
  Tx,
} from '../../model';
import {
  AfterTxCreator,
  applyModalObs,
  approveRingToIssuing,
  createTxObs,
  empty,
  formatBalance,
  getInfoFromHash,
  isSameAddress,
  isValidAddress,
  patchUrl,
  RedeemDeposit,
  redeemDeposit,
  RedeemEth,
  redeemToken,
} from '../../utils';
import { Balance } from '../Balance';
import { ApproveConfirm } from '../modal/ApproveConfirm';
import { ApproveSuccess } from '../modal/ApproveSuccess';
import { Des } from '../modal/Des';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';
import { DepositSelect, getDepositTimeRange } from './DepositSelect';

export type Ethereum2DarwiniaProps = BridgeFormProps & E2D;

enum E2DAssetEnum {
  ring = 'ring',
  kton = 'kton',
  deposit = 'deposit',
}

const BALANCE_FORMATTER = { noDecimal: false, decimal: 3, withThousandSplit: true };

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

/* ----------------------------------------------Tx section-------------------------------------------------- */

type ApproveValue = TransferFormValues<RequiredPartial<E2D, 'sender'>, NoNullTransferNetwork>;

function createApproveRingTx(value: ApproveValue, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <ApproveConfirm value={value} />,
  });
  const txObs = approveRingToIssuing(value);

  return createTxObs(beforeTx, txObs, after);
}

function createCrossTokenTx(value: RedeemEth, after: AfterTxCreator): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <TransferConfirm value={value} />,
  });
  const txObs = redeemToken(value);

  return createTxObs(beforeTx, txObs, after);
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

  return createTxObs(beforeTx, txObs, after);
}

// eslint-disable-next-line complexity
export function Ethereum({ form, setSubmit }: Ethereum2DarwiniaProps) {
  const { t } = useTranslation();
  const [allowance, setAllowance] = useState(new BN(0));
  const [max, setMax] = useState<BN | null>(null);
  const [isDeposit, setIsDeposit] = useState(false);
  const [fee, setFee] = useState<BN | null>(null);
  const [lock, setLock] = useState(false);
  const [removedDepositIds, setRemovedDepositIds] = useState<number[]>([]);
  const { accounts } = useApi();
  const { observer } = useTx();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { address: account } = accounts![0];
  const { afterTx } = useAfterSuccess();
  const refreshAmount = useCallback(
    (value: RedeemEth | ApproveValue) =>
      getIssuingAllowance(account, value.transfer.from).then((num) => {
        setAllowance(num);
        form.validateFields([FORM_CONTROL.amount]);
      }),
    [account, form]
  );

  const refreshBalance = useCallback(
    (value: RedeemEth | ApproveValue) => {
      if (value.asset === 'ring') {
        refreshAmount(value);
        getRingBalance(account, value.transfer.from).then((balance) => setMax(balance));
      } else {
        getKtonBalance(account, value.transfer.from).then((balance) => setMax(balance));
      }
    },
    [account, refreshAmount]
  );

  const refreshDeposit = useCallback(
    (value: RedeemDeposit) => {
      setRemovedDepositIds(() => [...removedDepositIds, value.deposit.deposit_id]);
    },
    [removedDepositIds]
  );

  const updateSubmit = useCallback(
    (asset: E2DAssetEnum) => {
      let fn = empty;

      if (asset === E2DAssetEnum.deposit) {
        fn = () => (value: RedeemDeposit) =>
          createCrossDepositTx(
            value,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            afterTx(TransferSuccess, { onDisappear: refreshDeposit as unknown as any })(value)
          ).subscribe(observer);
      } else {
        fn = () => (value: RedeemEth) =>
          createCrossTokenTx(value, afterTx(TransferSuccess, { onDisappear: refreshBalance })(value)).subscribe(
            observer
          );
      }

      setSubmit(fn);
    },
    [afterTx, observer, refreshBalance, refreshDeposit, setSubmit]
  );

  useEffect(() => {
    const netConfig: NetConfig = form.getFieldValue(FORM_CONTROL.transfer).from;
    const { recipient } = getInfoFromHash();

    form.setFieldsValue({
      [FORM_CONTROL.asset]: E2DAssetEnum.ring,
      [FORM_CONTROL.recipient]: recipient,
      [FORM_CONTROL.sender]: account,
    });
    updateSubmit(E2DAssetEnum.ring);
    getRingBalance(account, netConfig).then((balance) => setMax(balance));
    getFee(netConfig).then((crossFee) => setFee(crossFee));
    getIssuingAllowance(account, netConfig).then((num) => setAllowance(num));
  }, [account, form, updateSubmit]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { from, to } = form.getFieldValue(FORM_CONTROL.transfer) as TransferNetwork;
    const needLock = !from || !to;

    setLock(needLock);

    if (needLock) {
      form.setFieldsValue({ [FORM_CONTROL.recipient]: null });
    }
  });

  return (
    <>
      <Form.Item name={FORM_CONTROL.sender} className="hidden" rules={[{ required: true }]}>
        <Input disabled value={account} />
      </Form.Item>

      <Form.Item className="mb-0">
        <Form.Item
          label={t('Recipient')}
          name={FORM_CONTROL.recipient}
          validateFirst
          rules={[
            { required: true },
            {
              validator(_, value) {
                return !isSameAddress(account, value) ? Promise.resolve() : Promise.reject();
              },
              message: t('The sending address and the receiving address cannot be the same'),
            },
            {
              validator(_, value) {
                return isValidAddress(value, 'polkadot') ? Promise.resolve() : Promise.reject();
              },
              message: t('The address is wrong, please fill in a substrate address of the {{network}} network.', {
                network: 'darwinia',
              }),
            },
          ]}
          extra={t(
            'Please be sure to fill in the real Darwinia mainnet account, and keep the account recovery files such as mnemonic properly.'
          )}
        >
          <Input
            onChange={(event) => {
              patchUrl({ recipient: event.target.value });
            }}
            disabled={lock}
            suffix={lock && <LockOutlined />}
            size="large"
          />
        </Form.Item>
        {lock && <span className="text-gray-300">{t('You must select the destination network to unlock')}</span>}
      </Form.Item>

      <Form.Item name={FORM_CONTROL.asset} label={t('Asset')}>
        <Select
          size="large"
          onChange={async (value: E2DAssetEnum) => {
            form.setFieldsValue({ amount: null });

            let balance: null | BN = null;
            const netConfig: NetConfig = form.getFieldValue(FORM_CONTROL.transfer).from;

            if (value === E2DAssetEnum.ring) {
              balance = await getRingBalance(account, netConfig);
            }

            if (value === E2DAssetEnum.kton) {
              balance = await getKtonBalance(account, netConfig);
            }

            setIsDeposit(value === E2DAssetEnum.deposit);
            setMax(balance);
            updateSubmit(value);
          }}
        >
          <Select.Option value={E2DAssetEnum.ring}>RING</Select.Option>
          <Select.Option value={E2DAssetEnum.kton}>KTON</Select.Option>
          <Select.Option value={E2DAssetEnum.deposit} className="uppercase">
            {t('Deposit')}
          </Select.Option>
        </Select>
      </Form.Item>

      {isDeposit ? (
        <Form.Item name={FORM_CONTROL.deposit} label={t('Deposit')} rules={[{ required: true }]}>
          <DepositSelect
            address={account}
            config={form.getFieldValue(FORM_CONTROL.transfer).from}
            removedIds={removedDepositIds}
          />
        </Form.Item>
      ) : (
        <Form.Item className="mb-0">
          <Form.Item
            name={FORM_CONTROL.amount}
            validateFirst
            label={t('Amount')}
            rules={[
              { required: true },
              {
                validator: async (_, value) => {
                  const val = new BN(Web3.utils.toWei(value));
                  console.info(
                    '%c [ val, max, fee, fee < val, val < max -fee ]-210',
                    'font-size:13px; background:pink; color:#bf2c9f;',
                    val.toString(),
                    max?.toString(),
                    fee?.toString(),
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    fee!.lt(val),
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    val.lt(max!.sub(fee!))
                  );

                  return fee && fee.lt(val) && max && val.lte(max.sub(fee)) ? Promise.resolve() : Promise.reject();
                },
                message: t('Insufficient balance'),
              },
              {
                validator: (_, value: string) =>
                  allowance.gte(new BN(Web3.utils.toWei(value))) ? Promise.resolve() : Promise.reject(),
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
                          afterTx(ApproveSuccess, { onDisappear: refreshAmount })(value)
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
              placeholder={t('Available balance {{balance}}', {
                balance: max === null ? t('Searching') : formatBalance(max, 'ether', BALANCE_FORMATTER),
              })}
              className="flex-1"
            >
              <div
                className={`px-4 border border-l-0 cursor-pointer duration-200 ease-in flex items-center rounded-r-xl self-stretch transition-colors hover:text-${
                  form.getFieldValue(FORM_CONTROL.transfer).from?.name as Network
                }-main`}
                style={{ borderColor: '#434343' }}
                onClick={() => {
                  form.setFieldsValue({
                    [FORM_CONTROL.amount]: Web3.utils.fromWei(max && fee ? max?.sub(fee) : new BN(0)),
                  });
                }}
              >
                {t('All')}
              </div>
            </Balance>
          </Form.Item>

          <p className={fee && max && fee.lt(max) ? 'text-green-400' : 'text-red-400 animate-pulse'}>
            {t(`Cross-chain transfer fee. {{fee}} RING. (Account Balance. {{balance}} {{token}})`, {
              fee: formatBalance(fee ?? '', 'ether'),
              balance: formatBalance(max ?? '', 'ether', BALANCE_FORMATTER),
              token: (form.getFieldValue(FORM_CONTROL.asset) ?? '').toString().toUpperCase(),
            })}
          </p>
        </Form.Item>
      )}
    </>
  );
}
