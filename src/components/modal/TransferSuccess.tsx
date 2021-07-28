import { CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { NETWORK_LIGHT_THEME } from '../../config';
import { Tx } from '../../hooks';
import { Network, TransferFormValues } from '../../model';
import { E2DItems } from '../bridge/Ethereum2Darwinia';
import { SubscanLink } from '../SubscanLink';
import { Des } from './Des';

export function TransferSuccess<T extends E2DItems>({ tx, value }: { tx: Tx; value: TransferFormValues<T> }) {
  const { t } = useTranslation();
  const color = NETWORK_LIGHT_THEME[value.transfer.from?.name as Network]['@project-main-bg'];

  return (
    <>
      <Des
        title={
          <span className="capitalize">{t('{{network}} Network Address', { network: value.transfer.from?.name })}</span>
        }
        content={value.sender}
        icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>

      <Des
        title={
          <span className="capitalize">{t('{{network}} Network Address', { network: value.transfer.to?.name })}</span>
        }
        content={value.recipient}
        icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>

      <Des
        title={t('Details')}
        content={
          <div>
            <span>{value.amount}</span>
            <span className="uppercase ml-4">{value.asset}</span>
          </div>
        }
        icon={<CheckCircleFilled className="text-2xl" style={{ color }} />}
      ></Des>

      <p className="my-6">
        {t('The transaction has been sent, please check the transfer progress in the cross-chain history.')}
      </p>

      <SubscanLink txHash={tx.hash} network={value.transfer.from?.name as Network}>
        {t('View in subscan browser')}
      </SubscanLink>
    </>
  );
}
