import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Table, TableColumnType } from 'antd';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { DayFilter } from '../components/widget/DayFilter';

interface Record {
  state: string;
  time: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  id: string;
  executionFee: string;
}

const data: Record[] = [
  {
    id: '0',
    state: 'Await ChainRelay Confirm',
    time: '10 hours 23 mins ago',
    from: 'Ethereum 0xe596...F1E5',
    to: 'Darwinia 0xe596...F1E',
    amount: 'Sent: 1000.03 RING',
    fee: '0.123 ETH 10RINg',
    executionFee: '0.13Ring',
  },
  {
    id: '1',
    state: 'Await ChainRelay Confirm',
    time: '10 hours 23 mins ago',
    from: 'Ethereum 0xe596...F1E5',
    to: 'Darwinia 0xe596...F1E',
    amount: 'Sent: 1000.03 RING',
    fee: '0.123 ETH 10RINg',
    executionFee: '0.13Ring',
  },
  {
    id: '2',
    state: 'Await ChainRelay Confirm',
    time: '10 hours 23 mins ago',
    from: 'Ethereum 0xe596...F1E5',
    to: 'Darwinia 0xe596...F1E',
    amount: 'Sent: 1000.03 RING',
    fee: '0.123 ETH 10RINg',
    executionFee: '0.13Ring',
  },
];

function Page() {
  const { t } = useTranslation();
  const columns: TableColumnType<Record>[] = [
    {
      title: t('Status'),
      dataIndex: 'state',
    },
    {
      title: t('Time'),
      dataIndex: 'time',
    },
    {
      title: t('From'),
      dataIndex: 'from',
    },
    {
      title: t('To'),
      dataIndex: 'to',
    },
    {
      title: t('Amount'),
      dataIndex: 'amount',
    },
    {
      title: t('Fee'),
      key: 'fee',
      render() {
        return (
          <div>
            <div className="flex justify-between">
              <span>{t('Sent')}:</span>
              <span className="flex flex-col justify-end text-right">
                <span>100.22 RING</span>
                <span>88 KTON</span>
              </span>
            </div>

            <div className="flex justify-between">
              <span>{t('Received')}:</span>
              <span className="flex flex-col justify-end text-right">
                <span>100.22 RING</span>
                <span>88 KTON</span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: t('Execution Fee'),
      dataIndex: 'executionFee',
    },
  ];

  return (
    <div>
      <DayFilter />

      <div className="grid grid-cols-3 gap-6 place-items-center my-6">
        <div className="flex flex-col gap-4 bg-antDark w-full py-4 text-center">
          <span className="text-gray-400 uppercase">{t('transactions')}</span>
          <span className="text-4xl">10,200</span>
        </div>

        <div className="flex flex-col gap-4 bg-antDark w-full py-4 text-center">
          <span className="text-gray-400 uppercase">{t('unique users')}</span>
          <span className="text-4xl">800</span>
        </div>

        <div className="flex flex-col gap-4 bg-antDark w-full py-4 text-center">
          <span className="text-gray-400 uppercase">{t('supported blockchains')}</span>
          <span className="text-4xl">7</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          size="large"
          suffix={<SearchOutlined />}
          placeholder={t('Search by sender address')}
          className="max-w-md"
        />
        <Button size="large">{t('Filter')}</Button>
      </div>

      <div className="mt-6">
        <Table columns={columns} dataSource={data} rowKey="id" pagination={false} />
      </div>
    </div>
  );
}

export const Explorer = withRouter(Page);
