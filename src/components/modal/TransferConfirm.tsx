import { RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { TransferFormValues, Bridges } from '../../model';
import { Des } from './Des';

export function TransferConfirm({ value }: { value: TransferFormValues<Bridges> }) {
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

      {value.amount && value.asset && (
        <Des
          title={t('Amount')}
          content={
            <span>
              {value.amount}
              <span className="uppercase ml-2">{value.asset}</span>
            </span>
          }
        />
      )}

      {value.assets && (
        <Des
          title={t('Amount')}
          content={value.assets.map((bill) => (
            <span key={bill.asset}>
              {bill.amount}
              <span className="uppercase ml-2">{bill.asset}</span>
            </span>
          ))}
        ></Des>
      )}
    </>
  );
}
