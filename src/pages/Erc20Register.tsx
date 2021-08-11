import { Card } from 'antd';
import { Manager } from '../components/erc20/Manager';

export function Erc20Register() {
  return (
    <Card
      className="xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto drop-shadow"
      style={{ maxWidth: 520, borderColor: 'transparent' }}
    >
      <Manager />
    </Card>
  );
}
