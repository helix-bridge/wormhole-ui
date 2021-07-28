import { LockOutlined } from '@ant-design/icons';
import { Form, Input, Select } from 'antd';
import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';
import { abi, FORM_CONTROL } from '../../config';
import { BridgeFormProps, NetConfig, Network } from '../../model';
import { formatBalance, getInfoFromHash, isSameAddress, isValidAddress, patchUrl } from '../../utils';
import { Balance } from '../Balance';
import { DepositSelect } from './DepositSelect';

export type E2DKeys = keyof E2DItems;

export type E2DAsset = 'ring' | 'kton' | 'deposit';

export interface E2DItems {
  sender: string;
  asset?: E2DAsset;
  amount?: number | null;
  deposit?: string;
}

export type Ethereum2DarwiniaProps = BridgeFormProps & E2DItems;

export type TokenBalance = [string, string];

export enum E2DAssetEnum {
  ring = 'ring',
  kton = 'kton',
  deposit = 'deposit',
}

const BALANCE_FORMATTER = { noDecimal: false, decimal: 3, withThousandSplit: true };

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

async function hasIssuingAllowance(from: string, amount: string | number, config: NetConfig): Promise<boolean> {
  const web3js = new Web3(window.ethereum || window.web3.currentProvider);
  const erc20Contract = new web3js.eth.Contract(abi.tokenABI, config.tokenContract.ring);
  const allowanceAmount = await erc20Contract.methods.allowance(from, config.tokenContract.issuingDarwinia).call();

  return !Web3.utils.toBN(allowanceAmount).lt(Web3.utils.toBN(amount || '10000000000000000000000000'));
}

async function getFee(config: NetConfig): Promise<BN> {
  const web3js = new Web3(window.ethereum || window.web3.currentProvider);
  const erc20Contract = new web3js.eth.Contract(abi.registryABI, config.tokenContract.registryEth);
  const fee: number = await erc20Contract.methods
    .uintOf('0x55494e545f4252494447455f4645450000000000000000000000000000000000')
    .call();

  return web3js.utils.toBN(fee || 0);
}

// eslint-disable-next-line complexity
export function Ethereum2Darwinia({ lock, sender, form }: Ethereum2DarwiniaProps) {
  const { t } = useTranslation();
  const [max, setMax] = useState<BN | null>(null);
  const [isDeposit, setIsDeposit] = useState(false);
  const [fee, setFee] = useState<BN | null>(null);

  useEffect(() => {
    const netConfig: NetConfig = form.getFieldValue(FORM_CONTROL.transfer).from;
    const { recipient } = getInfoFromHash();

    form.setFieldsValue({ [FORM_CONTROL.asset]: E2DAssetEnum.ring, [FORM_CONTROL.recipient]: recipient });
    getRingBalance(sender, netConfig).then((balance) => setMax(balance));
    getFee(netConfig).then((crossFee) => setFee(crossFee));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const asset: E2DAsset = form.getFieldValue(FORM_CONTROL.asset);

    setIsDeposit(asset === 'deposit');
  }, [form]);

  useEffect(() => {
    if (lock) {
      form.setFieldsValue({ [FORM_CONTROL.recipient]: null });
    }
  }, [form, lock]);

  return (
    <>
      <Form.Item className="mb-0">
        <Form.Item
          label={t('Recipient')}
          name={FORM_CONTROL.recipient}
          validateFirst
          rules={[
            { required: true },
            {
              validator(_, value) {
                return !isSameAddress(sender, value) ? Promise.resolve() : Promise.reject();
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
              console.info('%c [ error ]-127', 'font-size:13px; background:pink; color:#bf2c9f;', event.target.value);
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
            setMax(Web3.utils.toBN(0));

            let balance: null | BN = null;
            const netConfig: NetConfig = form.getFieldValue(FORM_CONTROL.transfer).from;

            if (value === E2DAssetEnum.ring) {
              balance = await getRingBalance(sender, netConfig);
            }

            if (value === E2DAssetEnum.kton) {
              balance = await getKtonBalance(sender, netConfig);
            }

            if (value === E2DAssetEnum.deposit) {
              setIsDeposit(true);
              return;
            }

            setIsDeposit(false);
            setMax(balance);
          }}
        >
          <Select.Option value={E2DAssetEnum.ring}>RING</Select.Option>
          <Select.Option value={E2DAssetEnum.kton}>KTON</Select.Option>
          <Select.Option value={E2DAssetEnum.deposit}>{t('deposit')}</Select.Option>
        </Select>
      </Form.Item>

      {isDeposit ? (
        <Form.Item name={FORM_CONTROL.deposit} label={t('Deposit')} rules={[{ required: true }]}>
          <DepositSelect address={sender} config={form.getFieldValue(FORM_CONTROL.transfer).from} size="large" />
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

                  return fee && fee.lt(val) && max && val.lte(max.sub(fee)) ? Promise.resolve() : Promise.reject();
                },
                message: t('Insufficient balance'),
              },
              {
                validator: async (_, value: string) => {
                  const canIssuing = await hasIssuingAllowance(
                    sender,
                    Web3.utils.toWei(value),
                    form.getFieldValue(FORM_CONTROL.transfer).from
                  );

                  return canIssuing ? Promise.resolve() : Promise.reject();
                },
                message: t('Insufficient transfer authority'),
              },
            ]}
          >
            <Balance
              size="large"
              placeholder={t('Available balance {{balance}}', {
                balance: max === null ? '-' : formatBalance(max, 'ether', BALANCE_FORMATTER),
              })}
              className="flex-1 "
            >
              <div
                className={`px-4 border border-l-0 cursor-pointer duration-200 ease-in flex items-center rounded-r-xl self-stretch transition-colors hover:text-${
                  form.getFieldValue(FORM_CONTROL.transfer).from.name as Network
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

          <p className={fee && max && fee.lt(max) ? 'text-green-400' : 'text-red-400'}>
            {t(`Cross-chain transfer fee. {{fee}} RING. (Account Balance. {{ring}} RING)`, {
              fee: formatBalance(fee ?? '', 'ether'),
              ring: formatBalance(max ?? '', 'ether', BALANCE_FORMATTER),
            })}
          </p>
        </Form.Item>
      )}
    </>
  );
}
