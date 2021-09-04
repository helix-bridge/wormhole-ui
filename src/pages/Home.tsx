import { Card } from 'antd';
import { RouteComponentProps } from 'react-router-dom';
import { TransferForm } from '../components/TransferForm';
import { Path } from '../config/routes';
import { DepartureProvider } from '../providers';

export function Home(props: RouteComponentProps) {
  const {
    location: { pathname },
  } = props;
  const isCross = pathname === Path.root;

  return (
    <DepartureProvider>
      <Card className="xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto drop-shadow dark:border-transparent">
        <TransferForm isCross={isCross}></TransferForm>
      </Card>
    </DepartureProvider>
  );
}
