import { Button, Descriptions, Form } from 'antd';
import BN from 'bn.js';
import { isNull } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { from, map, Observable, switchMap, zip } from 'rxjs';
import Web3 from 'web3';
import { abi, FORM_CONTROL, RegisterStatus } from '../../config';
import { MemoedTokenInfo, useAfterSuccess, useApi, useMappedTokens, useTx } from '../../hooks';
import {
  BridgeFormProps,
  DVMTransfer,
  Erc20Token,
  Ethereum2DarwiniaTransfer,
  NetConfig,
  Network,
  NoNullTransferNetwork,
  RequiredPartial,
  TransferFormValues,
  Tx,
  TxFn,
} from '../../model';
import {
  AfterTxCreator,
  applyModalObs,
  backingLockS2S,
  createTxWorkflow,
  fromWei,
  getContractTxObs,
  getUnit,
  insufficientBalanceRule,
  IssuingDVMToken,
  isValidAddress,
  polkadotApi,
  prettyNumber,
  RedeemDVMToken,
  toWei,
  zeroAmountRule,
} from '../../utils';
import { getS2SMappingAddress } from '../../utils/erc20/token';
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
async function getAllowance(sender: string, config: NetConfig, token: Erc20Token | null): Promise<BN> {
  if (!token || !config) {
    return Web3.utils.toBN(0);
  }

  const web3js = new Web3(window.ethereum || window.web3.currentProvider);
  const erc20Contract = new web3js.eth.Contract(abi.tokenABI, token.address);
  const allowanceAmount = await erc20Contract.methods
    .allowance(sender, '0xdc552396caec809752fed0c5e23fd3983766e758')
    .call();

  return Web3.utils.toBN(allowanceAmount || 0);
}
/* ----------------------------------------------Tx section-------------------------------------------------- */
const approveToken: TxFn<
  RequiredPartial<
    TransferFormValues<Ethereum2DarwiniaTransfer & DVMTransfer, NoNullTransferNetwork>,
    'sender' | 'transfer'
  > & { contractAddress?: string }
> = ({ sender, contractAddress }) => {
  const hardCodeAmount = '100000000000000000000000000';

  if (!contractAddress) {
    throw new Error(`Can not approve the token with address ${contractAddress}`);
  }

  return getContractTxObs(contractAddress, (contract) =>
    contract.methods
      .approve('0xdc552396caec809752fed0c5e23fd3983766e758', Web3.utils.toWei(hardCodeAmount))
      .send({ from: sender, gas: '21000000', gasPrice: '50000000000' })
  );
};

function createApproveTx(
  value: Pick<ApproveValue, 'sender' | 'transfer' | 'asset'>,
  after: AfterTxCreator
): Observable<Tx> {
  const beforeTx = applyModalObs({
    content: <ApproveConfirm value={value} />,
  });
  const { sender, transfer } = value;
  const txObs = approveToken({ sender, transfer, contractAddress: '0x368b27B3Ae3EB885266FCE70896A7e5C54C93c1E' });

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
  const refreshAllowance = useCallback(
    (config: NetConfig) =>
      getAllowance(account, config, selectedErc20).then((num) => {
        setAllowance(num);
        form.validateFields([FORM_CONTROL.amount]);
      }),
    [account, form, selectedErc20]
  );
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
      const obs = zip([
        from(getS2SMappingAddress(value.transfer.from)),
        from(polkadotApi(value.transfer.from.provider.rpc)).pipe(
          map((api) => api.runtimeVersion.specVersion.toString())
        ),
      ]).pipe(
        switchMap(([mappingAddress, specVersion]) =>
          backingLockS2S(
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
          },
        })(value)
      ).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, observer, refreshTokenBalance, setSubmit]);

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
