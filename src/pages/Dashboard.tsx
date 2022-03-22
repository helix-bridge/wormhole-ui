import { GithubOutlined, GlobalOutlined, TwitterCircleFilled } from '@ant-design/icons';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import { DayFilter } from '../components/widget/DayFilter';

interface ChainProps {
  name: string;
  img: string;
  bestNumber: string | number;
}

const chains: ChainProps[] = [
  { name: 'Ethereum', img: '/image/ethereum.png', bestNumber: '6,029,137' },
  { name: 'Darwinia', img: '/image/darwinia.png', bestNumber: '6,029,137' },
  { name: 'Crab Smart Chain', img: '/image/crab-white-bg.png', bestNumber: '6,029,137' },
  { name: 'Ethereum', img: '/image/ethereum.png', bestNumber: '6,029,137' },
  { name: 'Pangolin', img: '/image/pangolin-2.png', bestNumber: '6,029,137' },
  { name: 'Pangolin Smart Chain', img: '/image/pangolin-white-bg.png', bestNumber: '6,029,137' },
  { name: 'Pangoro', img: '/image/pangoro.png', bestNumber: '6,029,137' },
];

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

function LineChart() {
  const charRef = useRef(null);
  const options = {
    chart: {
      type: 'column',
      height: 280,
      backgroundColor: {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
        stops: [
          [0, '#151e33'],
          [1, '#151e33'],
        ],
      },
    },
    title: {
      text: '',
    },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      crosshair: true,
    },
    legend: {
      enable: false,
    },
    yAxis: {
      visible: false,
    },
    /* eslint-disable no-magic-numbers */
    series: [
      {
        showInLegend: false,
        data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4],
      },
    ],
    credits: {
      enabled: false,
    },
    /* eslint-enable no-magic-numbers */
  };

  return <HighchartsReact highcharts={Highcharts} options={options} ref={charRef}></HighchartsReact>;
}

function Page() {
  const { t } = useTranslation();
  return (
    <div>
      <DayFilter />

      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-8 flex-1 p-4 bg-antDark">
          <span className="uppercase">{t('volume by week')}</span>
          <LineChart />
        </div>

        <div className="col-span-4 bg-antDark px-5 py-6">
          <div className="flex justify-between items-center">
            <h3 className="uppercase">{t('volume')}</h3>
            <span className="text-gray-400">Since Dec 21,2020(UTC)</span>
          </div>

          <div className="flex flex-col gap-2 items-center justify-center mt-10 mb-6">
            <h2 className="text-4xl">$834,312,847</h2>
            <span className="text-gray-400">{t('Total Volume')}</span>
          </div>

          <div className="flex flex-col gap-4">
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

      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-8 flex-1 p-4 bg-antDark">
          <span className="uppercase">{t('transactions by week')}</span>
          <LineChart />
        </div>

        <div className="col-span-4 bg-antDark px-5 py-6">
          <div className="flex justify-between items-center">
            <h3 className="uppercase">{t('transactions')}</h3>
            <span className="text-gray-400">Since Dec 21,2020(UTC)</span>
          </div>

          <div className="flex flex-col gap-2 items-center justify-center mt-10 mb-6">
            <h2 className="text-4xl">$834,312,847</h2>
            <span className="text-gray-400">{t('Total Volume')}</span>
          </div>

          <div className="flex flex-col gap-4">
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

      <div className="gap-6">
        <h2 className="uppercase my-6">{t('chains')}</h2>

        <div className="grid grid-cols-4 gap-6">
          {chains.map((item) => (
            <Chain {...item} key={item.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Dashboard = withRouter(Page);
