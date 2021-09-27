import { RightOutlined } from '@ant-design/icons';
import { PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Darwinia2EthereumTransfer, TxConfirmComponentProps } from '../../model';
import { convertToSS58, fromWei, getDisplayName, isPolkadotNetwork } from '../../utils';
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
  const sender = useMemo(
    () =>
      isPolkadotNetwork(value.transfer.from.name)
        ? convertToSS58(value.sender, value.transfer.from.ss58Prefix)
        : value.sender,
    [value]
  );

  return (
    <>
      <Des
        title={t('Cross-chain direction')}
        content={
          <>
            <span className="capitalize">{getDisplayName(value.transfer.from)}</span>
            <RightOutlined className="mx-4" />
            <span className="capitalize">{getDisplayName(value.transfer.to)}</span>
          </>
        }
      />

      <Des title={t('From')} content={sender} />

      <Des title={t('To')} content={value.recipient}></Des>

      {amountDes}
    </>
  );
}
