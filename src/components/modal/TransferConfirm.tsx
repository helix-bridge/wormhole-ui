import { RightOutlined } from '@ant-design/icons';
import { PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Darwinia2EthereumTransfer, TxConfirmComponentProps } from '../../model';
import { fromWei } from '../../utils';
import { Des } from './Des';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TransferConfirm({ value, children }: PropsWithChildren<TxConfirmComponentProps<any>>) {
  const { t } = useTranslation();
  const amountDes = useMemo(() => {
    if (children) {
      return children;
    } else if (value.assets) {
      return (
        <Des
          title={t('Amount')}
          content={value.assets.map((bill: Darwinia2EthereumTransfer['assets'][0]) => (
            <span key={bill.asset} className="mr-6">
              {fromWei({ value: bill.amount, unit: bill.unit ?? 'ether' })}
              <span className="uppercase ml-2">{bill.asset}</span>
            </span>
          ))}
        ></Des>
      );
    } else {
      return (
        <Des
          title={t('Amount')}
          content={
            <span>
              {value.amount}
              <span className="uppercase ml-2">{value.asset}</span>
            </span>
          }
        />
      );
    }
  }, [children, t, value.amount, value.asset, value.assets]);

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

      {amountDes}
    </>
  );
}
