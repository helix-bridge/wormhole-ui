import { Button, Descriptions, Form } from 'antd';
import BN from 'bn.js';
import { isNull } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { from, Observable, switchMap } from 'rxjs';
import Web3 from 'web3';
import { FORM_CONTROL, RegisterStatus } from '../../config';
import { MemoedTokenInfo, useAfterSuccess, useApi, useMappedTokens, useTx } from '../../hooks';
import {
  BridgeFormProps,
  DVMTransfer,
  Erc20Token,
  IssuingDVMToken,
  Network,
  NoNullTransferNetwork,
  RedeemDVMToken,
  Tx,
} from '../../model';
import {
  AfterTxCreator,
  applyModalObs,
  approveToken,
  createTxWorkflow,
  fromWei,
  getAllowance,
  getS2SMappingParams,
  getUnit,
  insufficientBalanceRule,
  isValidAddress,
  prettyNumber,
  redeemSubstrate,
  toWei,
  zeroAmountRule,
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
import { ApproveValue } from './Dvm';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

function createApproveTx(
  value: Pick<ApproveValue, 'sender' | 'transfer' | 'asset'>,
  after: AfterTxCreator,
  spender: string // for s2s, this is value is mappingFactory address -> 0xdc552396caec809752fed0c5e23fd3983766e758
): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <ApproveConfirm value={value} />,
  });
  const { sender, transfer, asset } = value;
  const txObs = approveToken({
    sender,
    transfer,
    tokenAddress: asset?.address,
    spender,
    sendOptions: { gas: '21000000', gasPrice: '50000000000' },
  });

  return createTxWorkflow(beforeTx, txObs, after);
}

/* ----------------------------------------------Main Section-------------------------------------------------- */

interface TransferInfoProps {
  amount: string;
  tokenInfo: MemoedTokenInfo;
}

function TransferInfo({ tokenInfo, amount }: TransferInfoProps) {
  const unit = getUnit(+tokenInfo.decimals);
  const value = new BN(toWei({ value: amount || '0', unit }));

  return (
    <Descriptions size="small" column={1} labelStyle={{ color: 'inherit' }} className="text-green-400">
      {!value.isZero() && (
        <Descriptions.Item label={<Trans>Recipient will receive</Trans>} contentStyle={{ color: 'inherit' }}>
          {fromWei({ value, unit })} {tokenInfo.symbol}
        </Descriptions.Item>
      )}
    </Descriptions>
  );
}

/**
 * @description test chain: pangolin dvm -> pangoro
 */
// eslint-disable-next-line complexity
export function SubstrateDVM2Substrate({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
  } = useApi();
  const { loading, tokens, refreshTokenBalance } = useMappedTokens(
    form.getFieldValue(FORM_CONTROL.transfer),
    RegisterStatus.registered
  );
  const [allowance, setAllowance] = useState(new BN(0));
  const [selectedErc20, setSelectedErc20] = useState<Erc20Token | null>(null);
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
  const { afterTx } = useAfterSuccess();
  const refreshAllowance = useCallback(async () => {
    const transfer = form.getFieldValue(FORM_CONTROL.transfer) as NoNullTransferNetwork;
    const { mappingAddress } = await getS2SMappingParams(transfer.from.provider.rpc);
    const allow = await getAllowance(account, mappingAddress, selectedErc20);

    setAllowance(allow);
    form.validateFields([FORM_CONTROL.amount]);
  }, [account, form, selectedErc20]);

  useEffect(() => {
    const fn = () => (value: RedeemDVMToken | IssuingDVMToken) => {
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
      const obs = from(getS2SMappingParams(value.transfer.from.provider.rpc)).pipe(
        switchMap(({ mappingAddress, specVersion }) =>
          redeemSubstrate(
            {
              ...value,
              amount: toWei({
                value: value.amount,
                unit: (selectedErc20?.decimals && getUnit(+selectedErc20.decimals)) || 'gwei',
              }),
            },
            mappingAddress,
            specVersion
          )
        )
      );

      return createTxWorkflow(
        beforeTx,
        obs,
        afterTx(TransferSuccess, {
          onDisappear: () => {
            refreshTokenBalance(value.asset.address);
            refreshAllowance();
          },
        })(value)
      ).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, observer, refreshAllowance, refreshTokenBalance, selectedErc20, setSubmit]);

  return (
    <>
      <EthereumAccountItem form={form} />

      <RecipientItem
        form={form}
        extraTip={t(
          'After the transaction is confirmed, the account cannot be changed. Please do not fill in the exchange account.'
        )}
      />

      <Form.Item name={FORM_CONTROL.asset} label={t('Asset')} rules={[{ required: true }]} className="mb-2">
        <Erc20Control
          loading={loading}
          tokens={tokens}
          onChange={async (erc20) => {
            setSelectedErc20(erc20);

            const transfer = form.getFieldValue(FORM_CONTROL.transfer) as NoNullTransferNetwork;
            const { mappingAddress } = await getS2SMappingParams(transfer.from.provider.rpc);
            const allow = await getAllowance(account, mappingAddress, erc20);

            setAllowance(allow);
          }}
        />
      </Form.Item>

      <Form.Item
        name={FORM_CONTROL.amount}
        validateFirst
        label={t('Amount')}
        rules={[
          { required: true },
          zeroAmountRule({ t }),
          insufficientBalanceRule({
            t,
            compared: selectedErc20?.balance,
            token: {
              symbol: selectedErc20?.symbol ?? '',
              decimal: getUnit(+(selectedErc20?.decimals ?? '9')),
            },
          }),
          {
            validator: (_, value: string) => {
              const val = new BN(Web3.utils.toWei(value));

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
                    const { mappingAddress } = await getS2SMappingParams(transfer.from?.provider.rpc);

                    createApproveTx(
                      value,
                      afterTx(ApproveSuccess, { onDisappear: () => refreshAllowance() })(value),
                      mappingAddress
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

      {!!curAmount && selectedErc20 && <TransferInfo amount={curAmount} tokenInfo={selectedErc20} />}
    </>
  );
}
