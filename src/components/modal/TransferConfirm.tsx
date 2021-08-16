import { RightOutlined } from '@ant-design/icons';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { TxConfirmComponentProps } from '../../model';
import { fromWei } from '../../utils';
import { Des } from './Des';

export function TransferConfirm({ value, children }: PropsWithChildren<TxConfirmComponentProps>) {
  const { t } = useTranslation();

  return (
    <>
      <Des
        title={t('Cross-chain direction')}
        content={
          <>
            <span className="uppercase">{value.transfer.from!.name}</span>
            <RightOutlined className="mx-4" />
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
            <span key={bill.asset} className="mr-6">
              {fromWei({ value: bill.amount, unit: bill.unit ?? 'ether' })}
              <span className="uppercase ml-2">{bill.asset}</span>
            </span>
          ))}
        ></Des>
      )}

      {children}
    </>
  );
}
