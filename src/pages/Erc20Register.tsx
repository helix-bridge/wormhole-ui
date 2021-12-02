import { Card } from 'antd';
import { Register } from '../components/erc20/Register';

export function Erc20Register() {
  return (
    <Card className="xl:w-1/3 lg:w-1/2 md:w-2/3 w-full mx-auto drop-shadow  dark:border-transparent">
      <Register />
    </Card>
  );
}
