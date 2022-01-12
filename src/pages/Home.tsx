import { Card } from 'antd';
import { withRouter } from 'react-router-dom';
import { CrossChain } from '../components/CrossChain';
import { DepartureProvider } from '../providers';

function Cross() {
  return (
    <DepartureProvider>
      <Card className="xl:w-1/3 lg:w-1/2 md:w-2/3 w-full mx-auto dark:shadow-none dark:border-transparent">
        <CrossChain></CrossChain>
      </Card>
    </DepartureProvider>
  );
}

export const Home = withRouter(Cross);
