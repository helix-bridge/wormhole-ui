import { Button, Form, Input } from 'antd';
import BN from 'bn.js';
import { isNull } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { abi, FORM_CONTROL } from '../../config';
import { Path } from '../../config/routes';
import { useAfterSuccess, useApi, useDeparture, useKnownErc20Tokens, useTx } from '../../hooks';
import {
  BridgeFormProps,
  DVMTransfer,
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
  fromWei,
  getInfoFromHash,
  getUnit,
  isValidAddress,
  prettyNumber,
  DVMFormValues,
  applyModalObs,
  approveToken,
  createTxWorkflow,
  redeemErc20,
  backingLockErc20,
} from '../../utils';
import { Balance } from '../controls/Balance';
import { Erc20Control } from '../controls/Erc20Control';
import { MaxBalance } from '../controls/MaxBalance';
import { RecipientItem } from '../controls/RecipientItem';
import { ApproveConfirm } from '../modal/ApproveConfirm';
import { ApproveSuccess } from '../modal/ApproveSuccess';
import { Des } from '../modal/Des';
import { TransferConfirm } from '../modal/TransferConfirm';
import { TransferSuccess } from '../modal/TransferSuccess';

const BN_ZERO = new BN(0);

export type ApproveValue = TransferFormValues<RequiredPartial<DVMTransfer, 'sender'>, NoNullTransferNetwork>;

interface DVMProps {
  isRedeem: boolean;
}

async function getAllowance(sender: string, config: NetConfig, token: Erc20Token | null): Promise<BN> {
  if (!token || !config) {
    return Web3.utils.toBN(0);
  }

  const web3js = new Web3(window.ethereum || window.web3.currentProvider);
  const erc20Contract = new web3js.eth.Contract(abi.tokenABI, token.address);
  const allowanceAmount = await erc20Contract.methods.allowance(sender, config.tokenContract.issuingDarwinia).call();

  return Web3.utils.toBN(allowanceAmount || 0);
}

function createApproveTx(
  value: Pick<ApproveValue, 'sender' | 'transfer' | 'asset'>,
  after: AfterTxCreator
): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <ApproveConfirm value={value} />,
  });
  const { sender, transfer, asset } = value;
  const txObs = approveToken({ sender, transfer, contractAddress: asset?.address });

  return createTxWorkflow(beforeTx, txObs, after);
}

function createErc20Tx(fn: (value: DVMFormValues) => Observable<Tx>) {
  return (value: DVMFormValues, after: AfterTxCreator): Observable<Tx> => {
    const beforeTx = applyModalObs({
      content: (
        <TransferConfirm value={value}>
          <Des
            title={<Trans>Amount</Trans>}
            content={
              <span>
                {value.amount} {value.asset.symbol}
              </span>
            }
          ></Des>
        </TransferConfirm>
      ),
    });
    const txObs = fn(value);

    return createTxWorkflow(beforeTx, txObs, after);
  };
}

export function DVM({ form, setSubmit, isRedeem }: BridgeFormProps<DVMTransfer> & DVMProps) {
  const { t } = useTranslation();
  const { loading, tokens, refreshTokenBalance } = useKnownErc20Tokens(
    form.getFieldValue(FORM_CONTROL.transfer).from.name
  );
  const [allowance, setAllowance] = useState(BN_ZERO);
  const [selectedErc20, setSelectedErc20] = useState<Erc20Token | null>(null);
  const {
    connection: { accounts },
  } = useApi();
  const { observer } = useTx();
  const { updateDeparture } = useDeparture();
  const { afterTx } = useAfterSuccess();
  const account = useMemo(() => {
    const acc = (accounts || [])[0];

    return isValidAddress(acc?.address, 'ethereum') ? acc.address : '';
  }, [accounts]);
  const unit = useMemo(() => (selectedErc20 ? getUnit(+selectedErc20.decimals) : 'ether'), [selectedErc20]);
  const availableBalance = useMemo(() => {
    return !selectedErc20
      ? null
      : fromWei({ value: selectedErc20.balance, unit: getUnit(+selectedErc20.decimals) }, prettyNumber);
  }, [selectedErc20]);

  const refreshAllowance = useCallback(
    (config: NetConfig) =>
      getAllowance(account, config, selectedErc20).then((num) => {
        setAllowance(num);
        form.validateFields([FORM_CONTROL.amount]);
      }),
    [account, form, selectedErc20]
  );
  const launchTx = useMemo(() => (isRedeem ? createErc20Tx(redeemErc20) : createErc20Tx(backingLockErc20)), [isRedeem]);

  useEffect(() => {
    const fn = () => (value: DVMFormValues) =>
      launchTx(
        value,
        afterTx(TransferSuccess, {
          onDisappear: () => {
            refreshTokenBalance(value.asset.address);
            refreshAllowance(value.transfer.from);
          },
        })(value)
      ).subscribe(observer);

    setSubmit(fn);
  }, [afterTx, observer, refreshAllowance, refreshTokenBalance, setSubmit, launchTx]);

  useEffect(() => {
    if (!account) {
      return;
    }

    const { recipient } = getInfoFromHash();

    form.setFieldsValue({
      [FORM_CONTROL.recipient]: recipient ?? '',
      [FORM_CONTROL.sender]: account,
    });

    const netConfig: NetConfig = form.getFieldValue(FORM_CONTROL.transfer).from;

    updateDeparture({ from: netConfig || undefined, sender: form.getFieldValue(FORM_CONTROL.sender) });
  }, [account, form, updateDeparture]);

  return (
    <>
      <Form.Item name={FORM_CONTROL.sender} className="hidden" rules={[{ required: true }]}>
        <Input disabled value={account} />
      </Form.Item>

      <RecipientItem
        form={form}
        extraTip={t(
          'After the transaction is confirmed, the account cannot be changed. Please do not fill in the exchange account.'
        )}
        isDvm
      />

      <Form.Item
        name={FORM_CONTROL.asset}
        label={t('Asset')}
        extra={
          <span className="inline-block mt-2">
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
          loading={loading}
          tokens={tokens}
          onChange={(erc20) => {
            setSelectedErc20(erc20);
            const departure = form.getFieldValue(FORM_CONTROL.transfer).from;

            getAllowance(account, departure, erc20).then((allow) => {
              setAllowance(allow);
            });
          }}
        />
      </Form.Item>

      <Form.Item
        name={FORM_CONTROL.amount}
        validateFirst
        label={t('Amount')}
        rules={[
          { required: true },
          {
            validator: (_, value: string) => {
              const val = new BN(Web3.utils.toWei(value));

              return allowance.gte(val) ? Promise.resolve() : Promise.reject();
            },
            message: (
              <Trans i18nKey="approveBalanceInsufficient">
                Exceed the authorized amount, click to authorize more amount, or reduce the transfer amount
                <Button
                  onClick={() => {
                    const value: Pick<ApproveValue, 'transfer' | 'sender' | 'asset'> = {
                      sender: account,
                      transfer: form.getFieldValue(FORM_CONTROL.transfer),
                      asset: selectedErc20,
                    };

                    createApproveTx(
                      value,
                      afterTx(ApproveSuccess, { onDisappear: () => refreshAllowance(value.transfer.from) })(value)
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
            balance: isNull(availableBalance) ? t('Searching') : availableBalance,
          })}
          className="flex-1"
        >
          <MaxBalance
            network={form.getFieldValue(FORM_CONTROL.transfer).from?.name as Network}
            onClick={() => {
              const amount = fromWei({ value: selectedErc20?.balance, unit }, prettyNumber);

              form.setFieldsValue({ [FORM_CONTROL.amount]: amount });
            }}
            size="large"
          />
        </Balance>
      </Form.Item>
    </>
  );
}
