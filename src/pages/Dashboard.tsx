import { GithubOutlined, GlobalOutlined, TwitterCircleFilled } from '@ant-design/icons';
import { Spin } from 'antd';
import BN from 'bn.js';
import { format, subMilliseconds } from 'date-fns';
import { GraphQLClient, useQuery } from 'graphql-hooks';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import { last } from 'lodash';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { DATE_FORMAT } from '../config/constant';
import { DailyStatistic } from '../model';
import { fromWei, prettyNumber } from '../utils';

interface ChainProps {
  name: string;
  img: string;
  bestNumber: string | number;
}

const chains: ChainProps[] = [
  { name: 'Ethereum', img: '/image/ethereum.png', bestNumber: '6,029,137' },
  { name: 'Darwinia', img: '/image/darwinia.png', bestNumber: '6,029,137' },
  { name: 'Crab Smart Chain', img: '/image/crab-white-bg.png', bestNumber: '6,029,137' },
  { name: 'Ropsten', img: '/image/ethereum.png', bestNumber: '6,029,137' },
  { name: 'Pangolin', img: '/image/pangolin-2.png', bestNumber: '6,029,137' },
  { name: 'Pangolin Smart Chain', img: '/image/pangolin-white-bg.png', bestNumber: '6,029,137' },
  { name: 'Pangoro', img: '/image/pangoro.png', bestNumber: '6,029,137' },
];

const client = new GraphQLClient({
  url: 'http://localhost:4000',
});

function toMillionSeconds(value: string | number) {
  const thousand = 1000;

  return +value * thousand;
}

function Chain({ name, img, bestNumber }: ChainProps) {
  return (
    <div className="flex items-center px-6 py-8 gap-6 bg-antDark">
      <img src={img} width={70} />

      <div className="flex flex-col gap-2">
        <h6>{name}</h6>
        <p style={{ color: '#1fe733' }}># {bestNumber}</p>
        <div className="flex gap-2 text-lg">
          <GlobalOutlined />
          <GithubOutlined />
          <TwitterCircleFilled />
        </div>
      </div>
    </div>
  );
}

type Statistic = [number, number];

interface BarChartProps {
  data: Statistic[]; // [timestamp<million seconds>, value];
  name: string;
}

function BarChart({ data, name }: BarChartProps) {
  const charRef = useRef(null);
  const mainColor = '#816eeb';
  const barColor = '#151e33';
  const options = {
    chart: {
      alignTicks: false,
      backgroundColor: {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
        stops: [
          [0, barColor],
          [1, barColor],
        ],
      },
    },
    rangeSelector: {
      buttons: [
        {
          type: 'all',
          text: 'ALL',
          title: 'ALL',
        },
        {
          type: 'week',
          count: 1,
          text: '7D',
          title: '7D',
        },
        {
          type: 'month',
          count: 1,
          text: '30D',
          title: '30D',
        },
      ],
      buttonPosition: {
        x: -23,
      },
      labelStyle: {
        display: 'none',
        width: 0,
      },
      buttonTheme: {
        fill: '#000',
        stroke: '#ffffff26',
        'stroke-width': 1,
        style: {
          color: 'white',
        },
        states: {
          hover: {},
          select: {
            fill: mainColor,
            style: {
              color: 'white',
            },
          },
        },
      },
      inputStyle: {
        color: '#9ca3af',
      },
    },
    scrollbar: {
      enabled: false,
    },
    navigator: {
      height: 24,
    },
    title: {
      text: '',
    },
    xAxis: {
      labels: {
        format: '{value:%m-%d}',
      },
    },
    yAxis: {
      visible: false,
    },
    /* eslint-disable no-magic-numbers */
    series: [
      {
        type: 'column',
        name,
        data,
        dataGrouping: {
          units: [
            ['week', [1]],
            ['month', [1, 2, 3, 4, 6]],
          ],
        },
      },
    ],
    credits: {
      enabled: false,
    },
    /* eslint-enable no-magic-numbers */
  };

  return (
    <HighchartsReact
      containerProps={{ className: 'h-48 lg:h-72' }}
      highcharts={Highcharts}
      constructorType="stockChart"
      options={options}
      ref={charRef}
    ></HighchartsReact>
  );
}

const STATISTICS_QUERY = `
  query dailyStatistics($timepast: Int!) {
    dailyStatistics(timepast: $timepast) {
      dailyCount
      dailyVolume
      id
    }
  }
`;

function Page() {
  const { t } = useTranslation();
  // eslint-disable-next-line no-magic-numbers
  const timepast = 6 * 30 * 24 * 3600;
  const { data: volumeStatistic, loading } = useQuery<{ dailyStatistics: DailyStatistic[] }>(STATISTICS_QUERY, {
    client,
    variables: { timepast },
  });

  const { volume, transactions, volumeTotal, transactionsTotal } = useMemo(() => {
    if (!volumeStatistic) {
      return { volume: [], transactions: [], volumeTotal: 0, transactionsTotal: 0 };
    }

    const { dailyStatistics } = volumeStatistic;

    return {
      volume: dailyStatistics
        .map(({ id, dailyVolume }) => [toMillionSeconds(id), +fromWei({ value: dailyVolume, unit: 'gwei' })])
        .reverse() as Statistic[],
      volumeTotal: dailyStatistics.reduce((acc, cur) => acc.add(new BN(cur.dailyVolume)), new BN(0)),
      transactions: dailyStatistics
        .map(({ id, dailyCount }) => [toMillionSeconds(id), dailyCount])
        .reverse() as Statistic[],
      transactionsTotal: dailyStatistics.reduce((acc, cur) => acc.add(new BN(cur.dailyCount)), new BN(0)),
    };
  }, [volumeStatistic]);

  const startTime = useMemo(() => {
    const date = !volumeStatistic?.dailyStatistics?.length
      ? subMilliseconds(new Date(), toMillionSeconds(timepast)).getTime()
      : toMillionSeconds(last(volumeStatistic!.dailyStatistics)!.id);

    return format(date, DATE_FORMAT) + ' (+UTC)';
  }, [timepast, volumeStatistic]);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-4 lg:mt-6">
        <div className="lg:col-span-8 flex-1 p-4 bg-antDark">
          <span className="uppercase">{t('volumes')}</span>
          {loading ? (
            <Spin size="large" className="block relative top-1/3" />
          ) : (
            <BarChart data={volume} name="volume" />
          )}
        </div>

        <div className="lg:col-span-4 bg-antDark px-5 py-6">
          <div className="flex justify-between items-center">
            <h3 className="uppercase">{t('volume')}</h3>
            <span className="text-gray-400">{startTime}</span>
          </div>

          <div className="flex flex-col gap-2 items-center justify-center mt-4 mb-2 md:mt-10 md:mb-6">
            <h2 className="text-4xl">{fromWei({ value: volumeTotal, unit: 'gwei' }, prettyNumber)}</h2>
            <span className="text-gray-400">{t('Total Volume')}</span>
          </div>

          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex justify-between">
              <span className="uppercase">{t('top 3 destination')}</span>
              <span className="uppercase">{t('volume')}</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <img src="/image/ethereum.png" width={24} />
                <span className="uppercase">Ethereum</span>
              </div>

              <span className="uppercase">6,000</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <img src="/image/darwinia.png" width={24} />
                <span className="uppercase">Darwinia</span>
              </div>

              <span className="uppercase">2,000</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <img src="/image/crab-white-bg.png" width={24} />
                <span className="uppercase">crab</span>
              </div>

              <span className="uppercase">1,000</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-4 lg:mt-6">
        <div className="lg:col-span-8 flex-1 p-4 bg-antDark">
          <span className="uppercase">{t('transactions')}</span>
          {loading ? (
            <Spin size="large" className="block relative top-1/3" />
          ) : (
            <BarChart data={transactions} name="transactions" />
          )}
        </div>

        <div className="lg:col-span-4 bg-antDark px-5 py-6">
          <div className="flex justify-between items-center">
            <h3 className="uppercase">{t('transactions')}</h3>
            <span className="text-gray-400">{startTime}</span>
          </div>

          <div className="flex flex-col gap-2 items-center justify-center  mt-4 mb-2 md:mt-10 md:mb-6">
            <h2 className="text-4xl">{prettyNumber(transactionsTotal)}</h2>
            <span className="text-gray-400">{t('Total Transactions')}</span>
          </div>

          <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex justify-between">
              <span className="uppercase">{t('top 3 destination')}</span>
              <span className="uppercase">{t('transactions')}</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <img src="/image/ethereum.png" width={24} />
                <span className="uppercase">Ethereum</span>
              </div>

              <span className="uppercase">6,000</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <img src="/image/darwinia.png" width={24} />
                <span className="uppercase">Darwinia</span>
              </div>

              <span className="uppercase">2,000</span>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <img src="/image/crab-white-bg.png" width={24} />
                <span className="uppercase">crab</span>
              </div>

              <span className="uppercase">1,000</span>
            </div>
          </div>
        </div>
      </div>

      <div className="gap-4 lg:gap-6">
        <h2 className="uppercase my-6">{t('chains')}</h2>

        <div className="grid md:grid-cols-4 gap-4 lg:gap-6">
          {chains.map((item) => (
            <Chain {...item} key={item.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Dashboard = withRouter(Page);
