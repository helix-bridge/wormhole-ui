import { Form, Select } from 'antd';
import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { combineLatest, EMPTY, filter, from, map, switchMap } from 'rxjs';
import Web3 from 'web3';
import { abi, FORM_CONTROL } from '../../../config';
import { useApi } from '../../../hooks';
import {
  AvailableBalance,
  Bridge,
  Chain,
  ConnectionStatus,
  CrossChainComponentProps,
  DVMChainConfig,
  PolkadotChainConfig,
  Substrate2DVMPayload,
  SubstrateDVMBridgeConfig,
} from '../../../model';
import { fromWei, getBridge, getPolkadotConnection, getUnit, toWei } from '../../../utils';
import { Balance } from '../../form-control/Balance';
import { EthereumAccountItem } from '../../form-control/EthereumAccountItem';
import { RecipientItem } from '../../form-control/RecipientItem';
import { FormItemExtra } from '../../widget/facade';

async function getTokenBalanceEth(ktonAddress: string, account = ''): Promise<[string, string]> {
  const web3 = new Web3(window.ethereum);
  let ring = '0';
  let kton = '0';

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

export function DVMSubstrate({
  form,
  direction,
  setSubmit,
}: CrossChainComponentProps<Substrate2DVMPayload, PolkadotChainConfig, DVMChainConfig>) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
  } = useApi();
  const [availableBalances, setAvailableBalances] = useState<AvailableBalance[]>([]);

  /**
   * TODO: remove this after api refactor
   */
  useEffect(() => {
    const { to } = direction;
    const account = accounts[0]?.address;
    const bridge = getBridge(direction) as unknown as Bridge<SubstrateDVMBridgeConfig>;
    const balancesObs = from(getTokenBalanceEth(bridge.config.contracts.kton, account));

    const chainInfoObs = getPolkadotConnection(to).pipe(
      filter((connection) => connection.status === ConnectionStatus.success),
      switchMap((connection) => {
        const { api } = connection;
        return api ? from(api.rpc.system.properties()) : EMPTY;
      }),
      map((chainState) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { tokenDecimals, tokenSymbol, ss58Format } = chainState?.toHuman() as any;

        return tokenDecimals.reduce(
          (acc: Chain, decimal: string, index: number) => {
            const unit = getUnit(+decimal);
            const token = { decimal: unit, symbol: tokenSymbol[index] };

            return { ...acc, tokens: [...acc.tokens, token] };
          },
          { ss58Format, tokens: [] }
        ) as Chain;
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
    const fn = () => (value: unknown) => {
      console.info('%c [ value ]-114', 'font-size:13px; background:pink; color:#bf2c9f;', value);
      return EMPTY.subscribe();
    };

    setSubmit(fn);
  }, [setSubmit]);

  return (
    <>
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

      <Form.Item label={t('Assets')} name={FORM_CONTROL.asset} rules={[{ required: true }]}>
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
