import { LockOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL } from '../../config';
import { useLock } from '../../hooks';
import { BridgeFormProps } from '../../model';
import { isPolkadotNetwork, isSameAddress, isValidAddress, patchUrl } from '../../utils';

// eslint-disable-next-line complexity
export function RecipientItem({
  form,
  extraTip,
  isDvm = false,
}: Omit<BridgeFormProps, 'setSubmit'> & { extraTip?: string | ReactNode; isDvm?: boolean }) {
  const { t } = useTranslation();
  const [lock] = useLock(form);

  const { to } = form.getFieldValue(FORM_CONTROL.transfer) || {};
  const isPolkadot = isPolkadotNetwork(to?.name);
  const type = isPolkadot ? to.name : 'ethereum';

  return (
    <Form.Item className="mb-0">
      <Form.Item
        label={t('Recipient')}
        name={FORM_CONTROL.recipient}
        validateFirst
        rules={[
          { required: true },
          {
            validator(_, value) {
              return isDvm || !isSameAddress(form.getFieldValue(FORM_CONTROL.sender), value)
                ? Promise.resolve()
                : Promise.reject();
            },
            message: t('The sending address and the receiving address cannot be the same'),
          },
          {
            validator(_, value) {
              return isValidAddress(value, !isDvm ? type : 'ethereum', true) ? Promise.resolve() : Promise.reject();
            },
            message: t('The address is wrong, please fill in a {{type}} address of the {{network}} network.', {
              type: !isDvm ? (isPolkadot ? 'substrate' : type) : 'DVM',
              network: to?.name,
            }),
          },
        ]}
        extra={to ? extraTip : ''}
        className="mb-2"
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
  );
}
