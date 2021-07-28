import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { TransferFormValues } from '../../model/transfer';
import { E2DItems } from '../bridge/Ethereum2Darwinia';
import { Des } from './Des';

export function TransferConfirm<T extends E2DItems>({ value }: { value: TransferFormValues<T> }) {
  const { t } = useTranslation();

  return (
    <>
      <Des
        title={t('Cross-chain direction')}
        content={
          <>
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            <span className="uppercase">{value.transfer.from!.name}</span>
            <RightOutlined />
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            <span className="uppercase">{value.transfer.to!.name}</span>
          </>
        }
      />

      <Des title={t('From')} content={value.sender} />

      <Des title={t('To')} content={value.recipient}></Des>

      <Des
        title={t('Amount')}
        content={
          <span>
            {value.amount}
            <span className="uppercase ml-2">{value.asset}</span>
          </span>
        }
      />
    </>
  );
}
