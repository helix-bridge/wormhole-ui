import { Spin } from 'antd';
import BN from 'bn.js';
import { format, subMilliseconds } from 'date-fns';
import { useQuery } from 'graphql-hooks';
import { last, omit } from 'lodash';
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
import { DailyStatistic } from '../../model';
import { fromWei, prettyNumber } from '../../utils';
import { BarChart, Statistic } from './BarChart';
import { Chain, ChainProps } from './Chain';
import { ChainStatisticOverview, Statistics } from './Statistics';

const RANK: ChainStatisticOverview[] = [
  { chain: 'Ethereum', logo: '/image/ethereum.png', total: '6,000' },
  { chain: 'Darwinia', logo: '/image/darwinia.png', total: '2,000' },
  { chain: 'Crab', logo: '/image/crab-white-bg.png', total: '4,000' },
];

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
  query dailyStatistics($timepast: Int!) {
    dailyStatistics(timepast: $timepast) {
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

  return (
    <div>
      <Statistics title={t('volumes')} startTime={startTime} total={volumeTotal} rank={RANK}>
        {loading ? <Spin size="large" className="block relative top-1/3" /> : <BarChart data={volume} name="volume" />}
      </Statistics>

      <Statistics title="transactions" startTime={startTime} total={transactionsTotal} rank={RANK}>
        {loading ? (
          <Spin size="large" className="block relative top-1/3" />
        ) : (
          <BarChart data={transactions} name="transactions" />
        )}
      </Statistics>

      <div className="gap-4 lg:gap-6">
        <h2 className="uppercase my-6">{t('chains')}</h2>

        <div className="grid md:grid-cols-4 gap-4 lg:gap-6">
          {chains.map((item) => (
            <Chain {...item} key={item.config.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Dashboard = withRouter(Page);
