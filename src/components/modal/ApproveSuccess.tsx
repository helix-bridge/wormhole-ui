import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Network, TransferParty, TxSuccessComponentProps } from '../../model';
import { SubscanLink } from '../SubscanLink';

export function ApproveSuccess({ value, tx }: TxSuccessComponentProps<TransferParty>) {
  const { t } = useTranslation();

  return (
    <>
      <Typography.Text>{t('Approve Success {{account}}', { account: value.sender })}</Typography.Text>
      <SubscanLink txHash={tx.hash} network={value.transfer.from?.name as Network} className="ml-4">
        {t('View in {{scan}} explorer', { scan: 'Etherscan' })}
      </SubscanLink>
    </>
  );
}
