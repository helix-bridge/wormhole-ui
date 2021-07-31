import { useTranslation } from 'react-i18next';
import { E2D, RequiredPartial, TransferFormValues } from '../../model';
import { Des } from './Des';

export function ApproveConfirm({ value }: { value: TransferFormValues<RequiredPartial<E2D, 'sender'>> }) {
  const { t } = useTranslation();

  return (
    <>
      <Des
        title={
          <span className="capitalize">{t('{{network}} Network Address', { network: value.transfer.from?.name })}</span>
        }
        content={value.sender}
        // icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>
    </>
  );
}
