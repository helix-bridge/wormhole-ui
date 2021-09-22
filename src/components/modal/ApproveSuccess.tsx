import { CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { NETWORK_LIGHT_THEME } from '../../config';
import { Network, TransferParty, TxSuccessComponentProps } from '../../model';
import { SubscanLink } from '../SubscanLink';
import { Des } from './Des';

export function ApproveSuccess({ value, tx }: TxSuccessComponentProps<TransferParty>) {
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

      <p className="my-6">
        {t('The transaction has been sent, please check the transfer progress in the cross-chain history.')}
      </p>

      <SubscanLink txHash={tx.hash} network={value.transfer.from?.name as Network}>
        {t('View in {{scan}} browser', { scan: 'Etherscan' })}
      </SubscanLink>
    </>
  );
}
