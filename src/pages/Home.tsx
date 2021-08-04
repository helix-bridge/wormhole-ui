import { Card } from 'antd';
import { Trans } from 'react-i18next';
import { HistoryLink } from '../components/HistoryLink';
import { TransferForm } from '../components/TransferForm';
import { DepartureProvider } from '../providers';

export function Home() {
  return (
    <DepartureProvider>
      <Card
        className="xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto drop-shadow"
        style={{ maxWidth: 520, borderColor: 'transparent' }}
      >
        <TransferForm></TransferForm>
      </Card>

      <p className="mt-4 text-center xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto">
        <Trans i18nKey="crossChainHistory" className="mt-4 text-center">
          You can view your <HistoryLink>Cross-chain history</HistoryLink>
        </Trans>
      </p>
    </DepartureProvider>
  );
}
