import { Card } from 'antd';
import { Trans } from 'react-i18next';
import { AirdropRecord } from '../components/record/Airdrop';

export function AirdropHistory() {
  return (
    <Card
      className="xl:w-1/3 lg:w-1/2 md:w-2/3 w-full mx-auto drop-shadow  dark:border-transparent"
      title={<Trans>Airdrop Records</Trans>}
    >
      <AirdropRecord />
    </Card>
  );
}
