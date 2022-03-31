import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Input, Table, TableColumnType, Tag } from 'antd';
import { formatDistanceToNow, getUnixTime } from 'date-fns';
import { useQuery } from 'graphql-hooks';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { DayFilter } from '../../components/widget/DayFilter';
import { CrossChainStatus, CrossChainStatusColor } from '../../config/constant';
import { Network, Substrate2SubstrateRecord } from '../../model';
import { convertToDvm, fromWei, getChainConfigByName, isValidAddress, prettyNumber } from '../../utils';
import { Party } from './Party';

const S2S_RECORDS = `
  query s2sRecords($first: Int!, $startTime: Int!, $sender: String) {
    s2sRecords(first: $first, start_timestamp: $startTime, sender: $sender) {
      id
      bridge
      fromChain
      fromChainMode
      toChain
      toChainMode
      laneId
      nonce
      requestTxHash
      responseTxHash
      sender
      recipient
      token
      amount
      startTime
      endTime
      result
    }
  }
`;

function Page() {
  const { t } = useTranslation();
  const [isValidSender, setIsValidSender] = useState(true);
  const startTime = useMemo(() => getUnixTime(new Date()), []);

  const { data, loading, refetch } = useQuery<{ s2sRecords: Substrate2SubstrateRecord[] }>(S2S_RECORDS, {
    variables: { first: 10, startTime },
  });

  const columns: TableColumnType<Substrate2SubstrateRecord>[] = [
    {
      title: t('Time'),
      dataIndex: 'startTime',
      render(value: string) {
        return formatDistanceToNow(new Date(value), { includeSeconds: true, addSuffix: true });
      },
    },
    {
      title: t('From'),
      dataIndex: 'fromChain',
      render: (value, record) => <Party chain={value} account={record.sender} mode={record.fromChainMode} />,
    },
    {
      title: t('To'),
      dataIndex: 'toChain',
      render: (value, record) => <Party chain={value} account={record.recipient} mode={record.toChainMode} />,
    },
    {
      title: t('Asset'),
      dataIndex: 'token',
      render: (_, record) => {
        const { fromChainMode, fromChain } = record;
        const config = getChainConfigByName(fromChain as Network);

        return `${fromChainMode === 'dvm' ? 'x' : ''}${config?.isTest ? 'O' : ''}RING`;
      },
    },
    {
      title: t('Amount'),
      dataIndex: 'amount',
      render: (value) => <span>{fromWei({ value, unit: 'gwei' }, prettyNumber)}</span>,
    },
    {
      title: t('Fee'),
      dataIndex: 'fee',
      render() {
        return <span>NAN</span>;
      },
    },
    {
      title: t('Bridge'),
      dataIndex: 'bridge',
    },
    {
      title: t('Status'),
      dataIndex: 'result',
      render: (value) => <Tag color={CrossChainStatusColor[value]}>{CrossChainStatus[value]}</Tag>,
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

      <div className="flex justify-between">
        <Input
          size="large"
          suffix={<SearchOutlined />}
          allowClear
          onChange={(event) => {
            const value = event.target.value;

            if (!value) {
              setIsValidSender(true);
              refetch({ variables: { first: 10, startTime: getUnixTime(new Date()) } });
              return;
            }

            try {
              const address = isValidAddress(value, 'ethereum') ? value : convertToDvm(value);

              refetch({ variables: { first: 10, startTime: getUnixTime(new Date()), sender: address } });
              setIsValidSender(true);
            } catch {
              setIsValidSender(false);
            }
          }}
          placeholder={t('Search by sender address')}
          className={`max-w-md ${isValidSender ? '' : 'border-red-400'}`}
        />

        <Button
          type="link"
          onClick={() => {
            refetch({ variables: { first: 10, startTime: getUnixTime(new Date()) } });
          }}
          disabled={loading}
          className="flex items-center cursor-pointer"
        >
          <span className="mr-2">{t('Latest transactions')}</span>
          <SyncOutlined />
        </Button>
      </div>

      <div className="mt-4 lg:mt-6">
        <Table columns={columns} dataSource={data?.s2sRecords || []} rowKey="id" pagination={false} loading={loading} />
      </div>
    </div>
  );
}

export const Explorer = withRouter(Page);
