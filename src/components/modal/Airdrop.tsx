import { CheckCircleFilled } from '@ant-design/icons';
import { Form, Input } from 'antd';
import { FormInstance } from 'antd/lib/form/Form';
import BN from 'bn.js';
import { fromUnixTime } from 'date-fns';
import { format } from 'date-fns/esm';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DATE_TIME_FORMATE, FORM_CONTROL, NETWORK_LIGHT_THEME } from '../../config';
import { Network, TransferFormValues } from '../../model';
import { isValidAddress } from '../../utils';
import { getAirdropData } from '../../utils/airdrop';
import { Des } from './Des';

export type AirdropProps = TransferFormValues<{ sender: string; recipient?: string; form: FormInstance }>;

const SNAPSHOT_TIMESTAMP = 1584683400;

export function Airdrop({ sender, transfer, form }: AirdropProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0');
  const color = NETWORK_LIGHT_THEME[transfer.from?.name as Network]['@project-main-bg'];

  useEffect(() => {
    const num = getAirdropData(sender, transfer.from!.name);

    setAmount(num.toString());
    form.setFieldsValue({ amount: num });
  }, [sender, transfer.from, form]);

  return (
    <Form form={form} layout="vertical">
      <Form.Item className="bg-gray-700 rounded-xl px-4">
        <Des
          title={<span className="capitalize">{t('Connected to {{network}}', { network: transfer.from?.name })}</span>}
          content={sender}
          icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
        ></Des>

        <Des
          title={<span className="capitalize">{t('Snapshot data')}</span>}
          content={
            <div className="flex flex-col">
              <span>{amount} RING</span>
              <span>{format(fromUnixTime(SNAPSHOT_TIMESTAMP), DATE_TIME_FORMATE + ' zz')}</span>
            </div>
          }
          icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
        ></Des>
      </Form.Item>

      <Form.Item
        name={FORM_CONTROL.recipient}
        label={t('Recipient')}
        validateFirst
        rules={[
          { required: true },
          {
            validator(_, value) {
              const valid = isValidAddress(value, 'polkadot');

              return valid ? Promise.resolve() : Promise.reject();
            },
            message: t('The address is wrong, please fill in a {{type}} address of the {{network}} network.', {
              type: 'Crab',
              network: 'Darwinia Crab',
            }),
          },
        ]}
      >
        <Input size="large" placeholder={t('Darwinia Crab Network account')} />
      </Form.Item>

      <Form.Item
        name="amount"
        className="hidden"
        rules={[
          { required: true },
          {
            validator(_, val: BN) {
              return val.gt(new BN(0)) ? Promise.resolve() : Promise.reject(t('Non available token to claimed!'));
            },
          },
        ]}
      >
        <Input />
      </Form.Item>
    </Form>
  );
}
