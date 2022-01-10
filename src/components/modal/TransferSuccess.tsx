import { CheckCircleFilled } from '@ant-design/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NETWORK_LIGHT_THEME } from '../../config';
import {
  Darwinia2EthereumPayload,
  Erc20Token,
  Network,
  CrossChainAsset,
  CrossChainPayload,
  TxSuccessComponentProps,
} from '../../model';
import {
  convertToSS58,
  fromWei,
  getDisplayName,
  getNetworkMode,
  isEthereumNetwork,
  isPolkadotNetwork,
} from '../../utils';
import { SubscanLink } from '../SubscanLink';
import { Des } from './Des';

function Detail({ amount, asset }: CrossChainAsset<string | Erc20Token>) {
  return (
    <div>
      <span>{amount}</span>
      <span className="ml-4">{typeof asset === 'string' ? asset : asset?.symbol}</span>
    </div>
  );
}

// eslint-disable-next-line complexity
export function TransferSuccess({
  tx,
  value,
  hashType = 'txHash',
  unit = 'ether',
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
TxSuccessComponentProps<CrossChainPayload<any>>) {
  const { t } = useTranslation();
  const color = NETWORK_LIGHT_THEME[value.transfer.from?.name as Network]['@project-main-bg'];
  const linkProps = { [hashType]: tx.hash };
  const sender = useMemo(
    () =>
      isPolkadotNetwork(value.transfer.from.name) && getNetworkMode(value.transfer.from) !== 'dvm'
        ? convertToSS58(value.sender, value.transfer.from.ss58Prefix)
        : value.sender,
    [value]
  );

  return (
    <>
      <Des
        title={
          <span className="capitalize">
            {t('{{network}} Network Address', { network: getDisplayName(value.transfer.from) })}
          </span>
        }
        content={sender}
        icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>

      <Des
        title={
          <span className="capitalize">
            {t('{{network}} Network Address', { network: getDisplayName(value.transfer.to) })}
          </span>
        }
        content={value.recipient}
        icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>

      <Des
        title={t('Details')}
        content={
          (value.asset && value.amount && <Detail {...value} amount={fromWei({ value: value.amount, unit })} />) ||
          (value.assets &&
            value.assets.map((item: Darwinia2EthereumPayload['assets'][0]) => (
              <Detail
                {...item}
                amount={item.unit ? fromWei({ value: item.amount, unit: item.unit }) : item.amount}
                key={item.asset}
              />
            )))
        }
        icon={<CheckCircleFilled className="text-2xl" style={{ color }} />}
      ></Des>

      <p className="my-6">
        {t('The transaction has been sent, please check the transfer progress in the cross-chain history.')}
      </p>

      <SubscanLink {...linkProps} network={value.transfer.from?.name as Network}>
        {t('View in {{scan}} explorer', {
          scan: isEthereumNetwork(value.transfer.from?.name) ? 'Etherscan' : 'Subscan',
        })}
      </SubscanLink>
    </>
  );
}
