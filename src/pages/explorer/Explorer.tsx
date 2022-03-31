import { SearchOutlined } from '@ant-design/icons';
import { Input, Table, TableColumnType } from 'antd';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { DayFilter } from '../../components/widget/DayFilter';

interface Record {
  state: string;
  time: string;
  from: string;
  to: string;
  amount: string;
  fee: string;
  id: string;
  asset: string;
  bridge: string;
}

const data: Record[] = [
  {
    id: '0',
    state: 'Await ChainRelay Confirm',
    asset: 'RING',
    time: '10 hours 23 mins ago',
    from: 'Ethereum 0xe596...F1E5',
    to: 'Darwinia 0xe596...F1E',
    amount: 'Sent: 1000.03 RING',
    fee: '0.123 ETH 10RING',
    bridge: '0.13Ring',
  },
  {
    id: '1',
    state: 'Await ChainRelay Confirm',
    asset: 'RING',
    time: '10 hours 23 mins ago',
    from: 'Ethereum 0xe596...F1E5',
    to: 'Darwinia 0xe596...F1E',
    amount: 'Sent: 1000.03 RING',
    fee: '0.123 ETH 10RING',
    bridge: '0.13Ring',
  },
  {
    id: '2',
    state: 'Await ChainRelay Confirm',
    asset: 'RING',
    time: '10 hours 23 mins ago',
    from: 'Ethereum 0xe596...F1E5',
    to: 'Darwinia 0xe596...F1E',
    amount: 'Sent: 1000.03 RING',
    fee: '0.123 ETH 10RING',
    bridge: '0.13Ring',
  },
];

function Page() {
  const { t } = useTranslation();
  const columns: TableColumnType<Record>[] = [
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
      title: t('Asset'),
      dataIndex: 'asset',
    },
    {
      title: t('Amount'),
      key: 'amount',
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
      title: t('Fee'),
      dataIndex: 'fee',
    },
    {
      title: t('Bridge'),
      dataIndex: 'Bridge',
    },
    {
      title: t('Status'),
      dataIndex: 'state',
    },
  ];

  return (
    <div>
      <DayFilter />

      <div className="grid lg:grid-cols-3 gap-0 lg:gap-6 place-items-center my-4 lg:my-6">
        <div className="flex justify-between items-center lg:flex-col lg:gap-4 bg-antDark w-full px-4 lg:px-0 py-2 lg:py-4 text-center">
          <span className="text-gray-400 uppercase">{t('transactions')}</span>
          <span className="text-xl lg:text-4xl">10,200</span>
        </div>

        <div className="flex justify-between items-center lg:flex-col lg:gap-4 bg-antDark w-full px-4 lg:px-0 py-2 lg:py-4 text-center">
          <span className="text-gray-400 uppercase">{t('unique users')}</span>
          <span className="text-xl lg:text-4xl">800</span>
        </div>

        <div className="flex justify-between items-center lg:flex-col lg:gap-4 bg-antDark w-full px-4 lg:px-0 py-2 lg:py-4 text-center">
          <span className="text-gray-400 uppercase">{t('supported blockchains')}</span>
          <span className="text-xl lg:text-4xl">7</span>
        </div>
      </div>

      <Input
        size="large"
        suffix={<SearchOutlined />}
        placeholder={t('Search by sender address')}
        className="max-w-md"
      />

      <div className="mt-4 lg:mt-6">
        <Table columns={columns} dataSource={data} rowKey="id" pagination={false} />
      </div>
    </div>
  );
}

export const Explorer = withRouter(Page);
