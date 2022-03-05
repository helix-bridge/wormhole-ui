import { ArrowRightOutlined } from '@ant-design/icons';
import { Unit } from 'web3-utils';
import { PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CrossChainAsset, CrossChainPayload, PolkadotChainConfig, TxConfirmComponentProps } from '../../model';
import { convertToSS58, fromWei, getDisplayName, getNetworkMode, isPolkadotNetwork } from '../../utils';
import { Des } from './Des';

export function TransferConfirm({
  value,
  children,
  unit = 'ether',
}: PropsWithChildren<TxConfirmComponentProps<CrossChainPayload>>) {
  const { t } = useTranslation();

  const amountDes = useMemo(() => {
    if (children) {
      return children;
    } else if (value.assets) {
      return (
        <Des
          title={t('Amount')}
          content={value.assets.map((bill: CrossChainAsset<string> & { unit?: Unit }) => (
            <span key={bill.asset} className="mr-6">
              {fromWei({ value: bill.amount, unit: bill.unit ?? unit })}
              <span className="ml-2">{bill.asset}</span>
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
              {fromWei({ value: value.amount, unit })}
              <span className="uppercase ml-2">{value.asset}</span>
            </span>
          }
        />
      );
    }
  }, [children, t, unit, value.amount, value.asset, value.assets]);

  const sender = useMemo(
    () =>
      isPolkadotNetwork(value.direction.from.name) && getNetworkMode(value.direction.from) === 'native'
        ? convertToSS58(value.sender, (value.direction.from as PolkadotChainConfig).ss58Prefix)
        : value.sender,
    [value]
  );

  return (
    <>
      <Des
        title={t('Cross-chain direction')}
        content={
          <>
            <span className="capitalize">{getDisplayName(value.direction.from)}</span>
            <ArrowRightOutlined className="mx-4" />
            <span className="capitalize">{getDisplayName(value.direction.to)}</span>
          </>
        }
      />

      <Des title={t('Sender Account')} content={sender} />

      <Des title={t('Recipient')} content={value.recipient}></Des>

      {amountDes}
    </>
  );
}
