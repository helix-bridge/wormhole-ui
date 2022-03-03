import { ApiPromise } from '@polkadot/api';
import { BN_ZERO } from '@polkadot/util';
import { Form, Select } from 'antd';
import BN from 'bn.js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { combineLatest, EMPTY, filter, from, map, switchMap, tap } from 'rxjs';
import Web3 from 'web3';
import { abi, FORM_CONTROL } from '../../../config';
import { useAfterSuccess, useApi, useTx } from '../../../hooks';
import {
  AvailableBalance,
  PolkadotChain,
  ConnectionStatus,
  CrossChainComponentProps,
  CrossChainPayload,
  DVMChainConfig,
  PolkadotChainConfig,
  SmartTxPayload,
  Substrate2DVMPayload,
} from '../../../model';
import {
  applyModalObs,
  createTxWorkflow,
  dvmAddressToAccountId,
  fromWei,
  getPolkadotConnection,
  getUnit,
  isKton,
  redeemFromDVM2Substrate,
  toWei,
  waitUntilConnected,
} from '../../../utils';
import { Balance } from '../../form-control/Balance';
import { EthereumAccountItem } from '../../form-control/EthereumAccountItem';
import { RecipientItem } from '../../form-control/RecipientItem';
import { TransferConfirm } from '../../modal/TransferConfirm';
import { TransferSuccess } from '../../modal/TransferSuccess';
import { FormItemExtra } from '../../widget/facade';
import { KtonDraw } from './KtonDraw';

async function getTokenBalanceEth(ktonAddress: string, account = ''): Promise<[string, string]> {
  let ring = '0';
  let kton = '0';

  if (!Web3.utils.isAddress(account)) {
    return [ring, kton];
  }

  const web3 = new Web3(window.ethereum);

  try {
    ring = await web3.eth.getBalance(account);
  } catch (error) {
    console.error(
      '%c [ get ring balance in ethereum error ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      (error as Record<string, string>).message
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ktonContract = new web3.eth.Contract(abi.ktonABI as any, ktonAddress, { gas: 55000 });

    kton = await ktonContract.methods.balanceOf(account).call();
  } catch (error) {
    console.error(
      '%c [ get kton balance in ethereum error ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      (error as Record<string, string>).message
    );
  }

  return [ring, kton];
}

export function DVM2Substrate({
  form,
  direction,
  setSubmit,
}: CrossChainComponentProps<Substrate2DVMPayload, DVMChainConfig, PolkadotChainConfig>) {
  const { t } = useTranslation();
  const {
    network,
    mainConnection: { accounts },
  } = useApi();
  const { observer } = useTx();
  const { afterTx } = useAfterSuccess<CrossChainPayload<SmartTxPayload>>();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);
  const [apiPromise, setApiPromise] = useState<ApiPromise | null>(null);
  const [pendingClaimAmount, setPendingClaimAmount] = useState<BN>(BN_ZERO);
  const kton = useMemo(() => availableBalances.find((item) => isKton(item.asset)), [availableBalances]);

  /**
   * TODO: remove this after api refactor
   */
  useEffect(() => {
    const { to, from: departure } = direction;
    const account = accounts[0]?.address;
    const balancesObs = from(getTokenBalanceEth(departure.dvm.smartKton, account));

    const chainInfoObs = getPolkadotConnection(to).pipe(
      filter((connection) => connection.status === ConnectionStatus.success),
      tap((connection) => {
        setApiPromise(connection.api);
      }),
      switchMap((connection) => {
        const { api } = connection;
        return api ? from(api.rpc.system.properties()) : EMPTY;
      }),
      map((chainState) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { tokenDecimals, tokenSymbol, ss58Format } = chainState?.toHuman() as any;

        return tokenDecimals.reduce(
          (acc: PolkadotChain, decimal: string, index: number) => {
            const unit = getUnit(+decimal);
            const token = { decimal: unit, symbol: tokenSymbol[index] };

            return { ...acc, tokens: [...acc.tokens, token] };
          },
          { ss58Format, tokens: [] }
        ) as PolkadotChain;
      })
    );

    const sub$$ = combineLatest([chainInfoObs, balancesObs]).subscribe(([{ tokens }, balances]) => {
      const res: AvailableBalance[] = tokens.map((token, index) => ({
        max: balances[index],
        asset: token.symbol,
        token,
      }));

      setAvailableBalances(res);
    });

    return () => sub$$.unsubscribe();
  }, [accounts, direction]);

  useEffect(() => {
    const fn = () => (data: SmartTxPayload) => {
      const { sender, amount } = data;

      const value = {
        ...data,
        amount: toWei({ value: amount }),
      };

      const beforeTransfer = applyModalObs({
        content: <TransferConfirm value={value} />,
      });

      const obs = redeemFromDVM2Substrate(value, direction);

      const afterTransfer = afterTx(TransferSuccess, {
        hashType: 'txHash',
        onDisappear: () => {
          form.setFieldsValue({
            [FORM_CONTROL.sender]: sender,
          });
          // getBalances(sender).then(setAvailableBalances);
        },
      })(value);

      return createTxWorkflow(beforeTransfer, obs, afterTransfer).subscribe(observer);
    };

    setSubmit(fn);
  }, [afterTx, availableBalances, direction, form, observer, setSubmit]);

  useEffect(() => {
    (async () => {
      const account = accounts[0]?.address;

      if (!network || !account || !apiPromise) {
        return;
      }

      await waitUntilConnected(apiPromise);

      try {
        const address = dvmAddressToAccountId(account).toHuman();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ktonUsableBalance = await (apiPromise.rpc as any).balances.usableBalance(1, address);
        const usableBalance: string = ktonUsableBalance.usableBalance.toString();
        const count = Web3.utils.toBN(usableBalance);

        setPendingClaimAmount(count);
      } catch (error) {
        console.warn((error as Record<string, string>).message);
      }
    })();
  }, [network, direction.to.provider.rpc, accounts, apiPromise]);

  return (
    <>
      {apiPromise && pendingClaimAmount.gt(BN_ZERO) && (
        <Form.Item>
          <KtonDraw
            direction={direction}
            kton={kton?.token}
            pendingClaimAmount={pendingClaimAmount}
            onSuccess={() => setPendingClaimAmount(BN_ZERO)}
          />
        </Form.Item>
      )}

      <EthereumAccountItem
        form={form}
        extra={
          availableBalances.length && (
            <FormItemExtra>
              {t('Available balance {{amount0}} {{symbol0}} {{amount1}} {{symbol1}}', {
                amount0: fromWei({ value: availableBalances[0].max }),
                amount1: fromWei({ value: availableBalances[1].max }),
                symbol0: availableBalances[0].token.symbol,
                symbol1: availableBalances[1].token.symbol,
              })}
            </FormItemExtra>
          )
        }
      />

      <RecipientItem
        form={form}
        direction={direction}
        extraTip={t(
          'Please make sure you have entered the correct {{type}} address. Entering wrong address will cause asset loss and cannot be recovered!',
          { type: 'Substrate' }
        )}
      />

      <Form.Item label={t('Asset')} name={FORM_CONTROL.asset} rules={[{ required: true }]}>
        <Select size="large" placeholder={t('Please select token to be transfer')}>
          {availableBalances.map(({ token: { symbol } }) => (
            <Select.Option value={symbol} key={symbol}>
              <span className="uppercase">{symbol}</span>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={t('Amount')}
        name="amount"
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value = '0') {
              const asset = getFieldValue(FORM_CONTROL.asset);
              const target = availableBalances.find(({ token: { symbol } }) => symbol === asset);
              const max = new BN(target?.max ?? 0);
              const cur = new BN(toWei({ value }) ?? 0);

              return cur.lt(max) ? Promise.resolve() : Promise.reject();
            },
            message: t(
              'The value entered must be greater than 0 and less than or equal to the maximum available value'
            ),
          }),
        ]}
      >
        <Balance size="large" className="flex-1" />
      </Form.Item>
    </>
  );
}
