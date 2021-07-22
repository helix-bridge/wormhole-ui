import { Card } from 'antd';
import { TransferForm } from '../components/TransferForm';

export function Home() {
  return (
    <Card className="xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto" style={{ maxWidth: 520 }}>
      <TransferForm></TransferForm>
    </Card>
  );
}
