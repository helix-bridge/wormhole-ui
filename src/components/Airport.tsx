import { decodeAddress } from '@polkadot/util-crypto';
import { Form, Input, message, Modal, Typography } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { isBoolean } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { filter, from, map, Observable, switchMap } from 'rxjs';
import Web3 from 'web3';
import { FORM_CONTROL } from '../config';
import { useApi } from '../hooks';
import { BridgeFormProps, TransferFormValues } from '../model';
import { applyModalObs, buf2hex } from '../utils';
import { Airdrop } from './modal/Airdrop';
import { AirdropSuccess } from './modal/AirdropSuccess';

type AirportValues = TransferFormValues<{
  sender: string;
  recipient: string;
  signature: string;
}>;

interface SignRes {
  sign: string;
  address: string;
  raw: string;
}

const { info } = Modal;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function signEth({ recipient, sender }: any): Observable<SignRes> {
  const ss58Prefix = 42;
  const address = buf2hex(decodeAddress(recipient, false, ss58Prefix));
  const raw = ss58Prefix + address;
  const web3 = new Web3(window.ethereum);
  const signObs = from(web3.eth.personal.sign(raw, sender, ''));

  // FIXME password ?
  return signObs.pipe(
    map((sign: string) => ({
      sign,
      address: sender,
      raw,
    }))
  );
}

export function Airport({ setSubmit, form }: BridgeFormProps<AirportValues>) {
  const { t } = useTranslation();
  const [signature] = useState<string>('');
  const [modalForm] = useForm();
  const {
    connection: { accounts },
  } = useApi();
  const { address: account } = (accounts || [])[0] ?? '';
  const updateSubmit = useCallback(() => {
    const fn = () => (value: AirportValues) => {
      applyModalObs<AirportValues>({
        content: <Airdrop {...value} form={modalForm} />,
        okText: t('Claim'),
        okButtonProps: {
          htmlType: 'submit',
          size: 'large',
        },
        handleOk: (observer, close) => {
          modalForm
            .validateFields()
            .then(() => {
              const values = modalForm.getFieldsValue();

              observer.next({ ...value, ...values } as AirportValues);
              close();
            })
            .catch((err) => {
              const msg = err?.errorFields[0]?.errors[0];

              message.error(msg);
            });
        },
      })
        .pipe(
          filter((result) => !isBoolean(result)),
          switchMap((data) => signEth(data))
        )
        .subscribe(({ sign }) => {
          info({
            content: <AirdropSuccess signature={sign} />,
            icon: null,
            okText: t('OK'),
          });
        });
    };
    setSubmit(fn);
  }, [modalForm, setSubmit, t]);

  useEffect(() => {
    updateSubmit();
  }, [updateSubmit]);

  useEffect(() => {
    form.setFieldsValue({ [FORM_CONTROL.sender]: account });
  }, [form, account]);

  return (
    <>
      <Form.Item name={FORM_CONTROL.sender} className="hidden" rules={[{ required: true }]}>
        <Input disabled value={account} />
      </Form.Item>

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
