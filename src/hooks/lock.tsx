import { FormInstance } from 'antd';
import { useEffect, useState } from 'react';
import { FORM_CONTROL } from '../config';
import { NoNullTransferNetwork, TransferFormValues, TransferNetwork } from '../model';

export function useLock(form: FormInstance<TransferFormValues<{ recipient: string }, NoNullTransferNetwork>>) {
  const [lock, setLock] = useState<boolean>(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { from, to } = form.getFieldValue(FORM_CONTROL.transfer) as TransferNetwork;
    const needLock = !from || !to;

    setLock(needLock);

    if (needLock) {
      form.setFieldsValue({ [FORM_CONTROL.recipient]: undefined });
    }
  });

  return [lock];
}
