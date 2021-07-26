import { Card } from 'antd';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TransferForm } from '../components/TransferForm';
import { Path } from '../config/routes';

export function Home() {
  return (
    <>
      <Card className="xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto" style={{ maxWidth: 520 }}>
        <TransferForm></TransferForm>
      </Card>

      <p className="mt-4 text-center xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto">
        <Trans i18nKey="crossChainHistory" className="mt-4 text-center">
          You can view your <Link to={Path.history}>Cross-chain history</Link>.
        </Trans>
      </p>
    </>
  );
}
