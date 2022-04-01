import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Affix, Button, Input, Table, TableColumnType } from 'antd';
import { formatDistanceToNow, getUnixTime } from 'date-fns';
import { useQuery } from 'graphql-hooks';
import { first, last } from 'lodash';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { CrossChainStatus, CrossChainStatusColor } from '../../config/constant';
import { useAccountStatistic, useDailyStatistic } from '../../hooks';
import { Network, Substrate2SubstrateRecord } from '../../model';
import {
  convertToDvm,
  fromWei,
  getChainConfigByName,
  getSupportedChains,
  isValidAddress,
  prettyNumber,
} from '../../utils';
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

const supportedChains = getSupportedChains();

interface ViewBoardProps {
  title: string;
  count: string | number;
}

const StatusIcons = [ClockCircleFilled, CheckCircleFilled, CloseCircleFilled];

function ViewBoard({ title, count }: ViewBoardProps) {
  return (
    <div className="flex justify-between items-center lg:flex-col lg:gap-4 bg-antDark w-full px-4 lg:px-0 py-2 lg:py-4 text-center">
      <span className="text-gray-400 uppercase">{title}</span>
      <span className="text-xl lg:text-4xl">{count}</span>
    </div>
  );
}

function Page() {
  const { t } = useTranslation();
  const [isValidSender, setIsValidSender] = useState(true);
  const startTime = useMemo(() => getUnixTime(new Date()), []);
  const { data: dailyStatistic } = useDailyStatistic();
  const { total: accountTotal } = useAccountStatistic();

  const transactionsTotal = useMemo(
    () => dailyStatistic?.dailyStatistics.reduce((acc, cur) => acc + cur.dailyCount, 0) ?? '-',
    [dailyStatistic]
  );

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
      render: (value) => {
        const Icon = StatusIcons[value];
        return (
          <div
            style={{ backgroundColor: CrossChainStatusColor[value] }}
            className="flex items-center gap-1 px-2 rounded-xs max-w-max"
          >
            <Icon />
            <span>{CrossChainStatus[value]}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="grid lg:grid-cols-3 gap-0 lg:gap-6 place-items-center my-4 lg:my-6">
        <ViewBoard title={t('transactions')} count={transactionsTotal} />
        <ViewBoard title={t('unique users')} count={accountTotal} />
        <ViewBoard title={t('supported blockchains')} count={supportedChains.length} />
      </div>

      <Affix offsetTop={64}>
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

        {/* TODO: use infinite scroll */}
        <div className="mt-4 lg:mt-6">
          <Table
            columns={columns}
            dataSource={data?.s2sRecords || []}
            rowKey="id"
            pagination={false}
            loading={loading}
          />

          {data && data.s2sRecords.length >= 10 && (
            <div className="flex items-center gap-4 mt-4 float-right">
              <Button
                onClick={() => {
                  const cursor = first(data.s2sRecords);
                  const start = getUnixTime(new Date(cursor!.startTime));

                  refetch({ variables: { first: 10, startTime: start } });
                }}
                size="small"
                className="flex items-center justify-center"
              >
                <LeftOutlined />
              </Button>

              <Button
                onClick={() => {
                  const cursor = last(data.s2sRecords);
                  const start = getUnixTime(new Date(cursor!.startTime));

                  refetch({ variables: { first: 10, startTime: start } });
                }}
                size="small"
                className="flex items-center justify-center"
              >
                <RightOutlined />
              </Button>
            </div>
          )}
        </div>
      </Affix>
    </div>
  );
}

export const Explorer = withRouter(Page);
