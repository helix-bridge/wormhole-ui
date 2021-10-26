import { useTranslation } from 'react-i18next';
import { NoNullTransferNetwork, TransferFormValues } from '../../model';
import { Des } from './Des';

export function ApproveConfirm({ value }: { value: TransferFormValues<{ sender: string }, NoNullTransferNetwork> }) {
  const { t } = useTranslation();

  return (
    <Des
      title={
        <span className="capitalize">{t('{{network}} Network Address', { network: value.transfer.from?.name })}</span>
      }
      content={value.sender}
    ></Des>
  );
}
