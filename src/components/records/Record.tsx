import { ClockCircleOutlined, ImportOutlined, RightOutlined } from '@ant-design/icons';
import { Collapse, Progress, Tooltip } from 'antd';
import { format } from 'date-fns';
import { fromUnixTime } from 'date-fns/esm';
import { PropsWithChildren } from 'react';
import { DATE_TIME_FORMATE } from '../../config';
import { EllipsisMiddle } from '../ShortAccount';
import { AssetOverview, AssetOverviewProps } from './AssetOverview';
import { ProgressDetailProps } from './ProgressDetail';

const { Panel } = Collapse;

export interface RecordProps extends ProgressDetailProps {
  blockTimestamp: number;
  recipient: string;
  assets: AssetOverviewProps[];
}

export function Record(props: PropsWithChildren<RecordProps>) {
  const { assets, recipient, blockTimestamp, from, to, children } = props;
  const { network: fromNetwork } = from;
  const { network: toNetwork } = to;

  return (
    <Collapse key={blockTimestamp} accordion expandIconPosition="right" className="mb-4">
      <Panel
        header={
          <div className="grid grid-cols-3 gap-0 lg:gap-16">
            <div className="flex gap-4 items-center col-span-3 md:col-span-2 md:mr-8">
              <img className="w-6 md:w-12 mx-auto" src={`/image/${fromNetwork}-button-mobile.png`} />

              <div className="relative flex items-center justify-around flex-1 col-span-2 h-12 bg-gray-900 bg-opacity-50 record-overview">
                <span>
                  {assets.map((asset) => (
                    <AssetOverview key={asset.currency} {...asset} />
                  ))}
                </span>

                <div className="flex items-center">
                  <RightOutlined className="opacity-30" />
                  <RightOutlined className="opacity-60" />
                  <RightOutlined className="opacity-90" />
                </div>

                <Progress
                  percent={50}
                  steps={4}
                  showInfo={false}
                  className="w-full absolute bottom-0 records-progress"
                  style={{ width: 'calc(100% - 3rem)' }}
                />
              </div>

              <img className="w-6 md:w-12 mx-auto" src={`/image/${toNetwork}-button-mobile.png`} />
            </div>

            <div className="flex flex-col justify-between ml-0 md:ml-4 mt-2 md:mt-0 col-span-3 md:col-span-1">
              <span className="flex items-center mb-2">
                <ClockCircleOutlined />
                <span className="ml-2">{format(fromUnixTime(+blockTimestamp), DATE_TIME_FORMATE)}</span>
              </span>

              <span className="w-full flex items-center">
                <Tooltip title={recipient} placement="top">
                  <ImportOutlined style={{ transform: 'rotateY(180deg)' }} className="mr-2" />
                </Tooltip>

                <EllipsisMiddle className="flex items-center text-right">{recipient}</EllipsisMiddle>
              </span>
            </div>
          </div>
        }
        key={blockTimestamp}
        className="overflow-hidden"
      >
        {children}
      </Panel>
    </Collapse>
  );
}
