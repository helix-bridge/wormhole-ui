import { Card } from 'antd';
import { Trans } from 'react-i18next';
import { Link, RouteComponentProps } from 'react-router-dom';
import { CrossChain } from '../components/CrossChain';
import { Path } from '../config/routes';
import { DepartureProvider } from '../providers';

export function Home(props: RouteComponentProps) {
  const {
    location: { pathname },
  } = props;
  const isCross = pathname === Path.root;

  return (
    <DepartureProvider>
      <Card className="xl:w-1/3 lg:w-1/2 md:w-2/3 w-full mx-auto dark:shadow-none dark:border-transparent">
        <CrossChain isCross={isCross}></CrossChain>
      </Card>

      <p className="mt-4 text-center xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto">
        {!isCross && (
          <Trans i18nKey="viewAirdropHistory" className="mt-4 text-center">
            You can view your <Link to={Path.airdropHistory}>Airdrop history</Link>
          </Trans>
        )}
      </p>
    </DepartureProvider>
  );
}
