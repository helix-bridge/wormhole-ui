import { Spin } from 'antd';
import BN from 'bn.js';
import { format, subMilliseconds } from 'date-fns';
import { useQuery } from 'graphql-hooks';
import { last, omit, orderBy } from 'lodash';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { DATE_FORMAT } from '../../config/constant';
import {
  crabConfig,
  darwiniaConfig,
  ethereumConfig,
  pangolinConfig,
  pangoroConfig,
  ropstenConfig,
} from '../../config/network';
import { ChainConfig, DailyStatistic } from '../../model';
import { fromWei, prettyNumber } from '../../utils';
import { BarChart, Statistic } from './BarChart';
import { Chain, ChainProps } from './Chain';
import { Statistics } from './Statistics';

interface StatisticTotal {
  volume: BN;
  transactions: BN;
}

const chains: ChainProps[] = [
  { config: ethereumConfig },
  { config: darwiniaConfig },
  { config: crabConfig, logoKey: 'logoAssist' },
  { config: ropstenConfig },
  { config: omit(pangolinConfig, 'dvm'), logoKey: 'logoAssist2' },
  { config: pangolinConfig, logoKey: 'logoAssist' },
  { config: pangoroConfig },
];

function toMillionSeconds(value: string | number) {
  const thousand = 1000;

  return +value * thousand;
}

const STATISTICS_QUERY = `
  query dailyStatistics($timepast: Int!, $chain: String) {
    dailyStatistics(timepast: $timepast, chain: $chain) {
      dailyCount
      dailyVolume
      id
    }
  }
`;

// eslint-disable-next-line no-magic-numbers
const TIMEPAST = 6 * 30 * 24 * 3600;

function Page() {
  const { t } = useTranslation();

  const { data: volumeStatistic, loading } = useQuery<{ dailyStatistics: DailyStatistic[] }>(STATISTICS_QUERY, {
    variables: { timepast: TIMEPAST },
  });

  const { data: crabStatistic } = useQuery<{ dailyStatistics: DailyStatistic[] }>(STATISTICS_QUERY, {
    variables: { timepast: TIMEPAST, chain: 'crab' },
  });

  const { data: darwiniaStatistic } = useQuery<{ dailyStatistics: DailyStatistic[] }>(STATISTICS_QUERY, {
    variables: { timepast: TIMEPAST, chain: 'darwinia' },
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
      volumeTotal: fromWei(
        { value: dailyStatistics.reduce((acc, cur) => acc.add(new BN(cur.dailyVolume)), new BN(0)), unit: 'gwei' },
        prettyNumber
      ),
      transactions: dailyStatistics
        .map(({ id, dailyCount }) => [toMillionSeconds(id), dailyCount])
        .reverse() as Statistic[],
      transactionsTotal: prettyNumber(
        dailyStatistics.reduce((acc, cur) => acc.add(new BN(cur.dailyCount)), new BN(0)),
        { decimal: 0 }
      ),
    };
  }, [volumeStatistic]);

  const startTime = useMemo(() => {
    const date = !volumeStatistic?.dailyStatistics?.length
      ? subMilliseconds(new Date(), toMillionSeconds(TIMEPAST)).getTime()
      : toMillionSeconds(last(volumeStatistic!.dailyStatistics)!.id);

    return format(date, DATE_FORMAT) + ' (+UTC)';
  }, [volumeStatistic]);

  const { volumeRank, transactionsRank } = useMemo(() => {
    const calcTotal = (key: keyof DailyStatistic) => (acc: BN, cur: DailyStatistic) => acc.add(new BN(cur[key]));
    const calcVolumeTotal = calcTotal('dailyVolume');
    const calcTransactionsTotal = calcTotal('dailyCount');

    const calcChainTotal: (data: DailyStatistic[]) => StatisticTotal = (data) => ({
      volume: data.reduce(calcVolumeTotal, new BN(0)),
      transactions: data.reduce(calcTransactionsTotal, new BN(0)),
    });

    const rankSource = [
      { chain: crabConfig, statistic: calcChainTotal(crabStatistic?.dailyStatistics || []) },
      { chain: darwiniaConfig, statistic: calcChainTotal(darwiniaStatistic?.dailyStatistics || []) },
    ];

    const calcRank: (key: keyof StatisticTotal) => { chain: ChainConfig; total: BN }[] = (
      key: keyof StatisticTotal
    ) => {
      const source = rankSource.map(({ chain, statistic }) => ({ chain, total: statistic[key] }));

      return orderBy(source, (item) => item.total.toNumber(), 'desc');
    };

    return {
      volumeRank: calcRank('volume').map(({ chain, total }) => ({
        chain,
        total: fromWei({ value: total, unit: 'gwei' }),
      })),
      transactionsRank: calcRank('transactions').map(({ chain, total }) => ({ chain, total: total.toString() })),
    };
  }, [crabStatistic, darwiniaStatistic]);

  return (
    <div>
      <Statistics title={t('volumes')} startTime={startTime} total={volumeTotal} rank={volumeRank}>
        {loading ? <Spin size="large" className="block relative top-1/3" /> : <BarChart data={volume} name="volume" />}
      </Statistics>

      <Statistics title="transactions" startTime={startTime} total={transactionsTotal} rank={transactionsRank}>
        {loading ? (
          <Spin size="large" className="block relative top-1/3" />
        ) : (
          <BarChart data={transactions} name="transactions" />
        )}
      </Statistics>

      <div className="gap-4 lg:gap-6">
        <h2 className="uppercase my-6">{t('chains')}</h2>

        <div className="grid md:grid-cols-4 gap-4 lg:gap-6">
          {chains.map((item, index) => (
            <Chain {...item} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Dashboard = withRouter(Page);
