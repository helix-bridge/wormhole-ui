import { Form, FormInstance, Input } from 'antd';
import { useEffect, useMemo } from 'react';
import { FORM_CONTROL } from '../../config';
import { useApi, useDeparture } from '../../hooks';
import { isValidAddress } from '../../utils';

export function EthereumAccountItem({ form }: { form: FormInstance }) {
  const {
    connection: { accounts },
  } = useApi();
  const { updateDeparture } = useDeparture();
  const account = useMemo(() => {
    const acc = (accounts || [])[0];

    return isValidAddress(acc?.address, 'ethereum') ? acc.address : '';
  }, [accounts]);

  useEffect(() => {
    form.setFieldsValue({ [FORM_CONTROL.sender]: account });

    updateDeparture({ from: form.getFieldValue(FORM_CONTROL.transfer).from, sender: account });
  }, [account, form, updateDeparture]);

  return (
    <Form.Item name={FORM_CONTROL.sender} className="hidden" rules={[{ required: true }]}>
      <Input disabled value={account} />
    </Form.Item>
  );
}
