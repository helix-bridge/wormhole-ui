import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Network, CrossChainParty, TxSuccessComponentProps } from '../../model';
import { SubscanLink } from '../widget/SubscanLink';

export function ApproveSuccess({ value, tx }: TxSuccessComponentProps<CrossChainParty>) {
  const { t } = useTranslation();

  return (
    <>
      <Typography.Text>{t('Approve Success {{account}}', { account: value.sender })}</Typography.Text>
      <SubscanLink txHash={tx.hash} network={value.direction.from?.name as Network} className="ml-4">
        {t('View in {{scan}} explorer', { scan: 'Etherscan' })}
      </SubscanLink>
    </>
  );
}
