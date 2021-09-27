import { LockOutlined } from '@ant-design/icons';
import { Form, FormInstance, Input } from 'antd';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FORM_CONTROL } from '../../config';
import { useLock } from '../../hooks';
import { BridgeFormProps, NoNullTransferNetwork, TransferFormValues, TransferParty } from '../../model';
import { isPolkadotNetwork, isSameAddress, isValidAddress, patchUrl } from '../../utils';

// eslint-disable-next-line complexity
export function RecipientItem({
  form,
  extraTip,
  isDvm = false,
}: Omit<BridgeFormProps<TransferParty>, 'setSubmit'> & { extraTip?: string | ReactNode; isDvm?: boolean }) {
  const { t } = useTranslation();
  const [lock] = useLock(form as FormInstance<TransferFormValues<TransferParty, NoNullTransferNetwork>>);

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
            message: !isDvm
              ? t('Please enter a valid {{network}} address', { network: to?.fullName })
              : t('Please fill in a {{network}} smart address which start with 0x', { network: to?.fullName }),
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
