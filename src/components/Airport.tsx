import { decodeAddress } from '@polkadot/util-crypto';
import { Form, Input, message, Typography } from 'antd';
import BN from 'bn.js';
import { format, fromUnixTime } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catchError, EMPTY, from, map, Observable, of } from 'rxjs';
import Web3 from 'web3';
import { DATE_TIME_FORMATE, FORM_CONTROL } from '../config';
import { useApi } from '../hooks';
import { BridgeFormProps, TransferFormValues, TransferNetwork } from '../model';
import { buf2hex, getAirdropData, isValidAddress } from '../utils';

type AirportValues = TransferFormValues<{
  sender: string;
  recipient: string;
  signature: string;
  amount: string;
}>;

interface SignRes {
  address: string;
  msg: string;
  sign: string;
  signer: 'DarwiniaNetworkClaims';
  version: string;
}

const SNAPSHOT_TIMESTAMP = 1584683400;

function signWith(data: AirportValues): Observable<SignRes> {
  const { transfer, recipient, sender } = data;
  const { from: come } = transfer;
  const ss58Prefix = 42;
  const address = buf2hex(decodeAddress(recipient, false, ss58Prefix).buffer);
  // eslint-disable-next-line no-magic-numbers
  const raw = 'Pay RINGs to the Crab account:' + address.slice(2);
  const web3 = new Web3(window.ethereum);
  let signObs = of('');

  if (come?.name === 'ethereum') {
    signObs = from(web3.eth.personal.sign(raw, sender, ''));
  }

  if (come?.name === 'tron') {
    signObs = from(window.tronWeb.trx.sign(Web3.utils.stringToHex(raw))) as Observable<string>;
  }

  return signObs.pipe(
    map(
      (sign: string) =>
        ({
          address: come?.name === 'tron' ? window.tronWeb.address.toHex(sender) : sender,
          msg: raw,
          sign,
          signer: 'DarwiniaNetworkClaims',
          version: '3',
        } as SignRes)
    ),
    catchError((err: string) => {
      message.error(err);
      return EMPTY;
    })
  );
}

export function Airport({ setSubmit, form, transfer }: BridgeFormProps<AirportValues> & { transfer: TransferNetwork }) {
  const { t } = useTranslation();
  const [signature] = useState<string>('');
  const {
    connection: { accounts },
  } = useApi();
  const [amount, setAmount] = useState('0');
  const { address: account } = useMemo(() => (accounts || [])[0] ?? { address: '' }, [accounts]);

  useEffect(() => {
    const num = getAirdropData(account, transfer.from!.name);

    setAmount(num.toString());
    form.setFieldsValue({ amount: num.toString() });
  }, [account, form, transfer.from]);

  useEffect(() => {
    const fn = () => (value: AirportValues) => {
      signWith(value).subscribe(() => {
        message.success(t('Claim success!'));
      });
    };

    setSubmit(fn);
  }, [setSubmit, t]);

  useEffect(() => {
    form.setFieldsValue({ [FORM_CONTROL.sender]: account });
  }, [form, account]);

  return (
    <>
      <Form.Item
        label={
          <span className="capitalize">
            {t('Connected to {{network}}', { network: form.getFieldValue(FORM_CONTROL.transfer)?.from?.name ?? '' })}
          </span>
        }
        name={FORM_CONTROL.sender}
        rules={[{ required: true }]}
      >
        <Input size="large" disabled value={account} />
      </Form.Item>

      <Form.Item
        name={FORM_CONTROL.amount}
        label={<span className="capitalize">{t('Snapshot data')}</span>}
        rules={[
          { required: true },
          {
            validator(_, val: string) {
              return new BN(val).lt(new BN(0)) ? Promise.resolve() : Promise.reject();
            },
            message: t('No available RING for claiming'),
          },
        ]}
      >
        <div className="flex flex-col px-4 py-2 rounded-lg bg-gray-900">
          <span>{amount} RING</span>
          <span>{format(fromUnixTime(SNAPSHOT_TIMESTAMP), DATE_TIME_FORMATE + ' zz')}</span>
        </div>
      </Form.Item>

      <Form.Item
        name={FORM_CONTROL.recipient}
        label={t('Recipient')}
        validateFirst
        rules={[
          { required: true },
          {
            validator(_, value) {
              return isValidAddress(value, 'crab', true) ? Promise.resolve() : Promise.reject();
            },
            message: t('Please enter a valid {{network}} address', { network: 'Darwinia Crab' }),
          },
        ]}
      >
        <Input size="large" placeholder={t('Darwinia Crab Network account')} />
      </Form.Item>

      {/* <Form.Item name={FORM_CONTROL.amount} className="hidden" rules={[{ required: true }]}>
        <Input />
      </Form.Item> */}

      {signature && (
        <Form.Item label={t('Signature')}>
          <Typography.Text copyable code className="whitespace-normal">
            {signature}
          </Typography.Text>
        </Form.Item>
      )}
    </>
  );
}
