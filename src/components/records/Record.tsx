import { ClockCircleOutlined, ImportOutlined, RightOutlined } from '@ant-design/icons';
import { Collapse, Progress, Tooltip } from 'antd';
import { format, utcToZonedTime } from 'date-fns-tz';
import { fromUnixTime } from 'date-fns/esm';
import { PropsWithChildren, useMemo } from 'react';
import { DATE_TIME_FORMATE } from '../../config';
import { ChainConfig } from '../../model';
import { chainConfigToVertices, isSubstrate2SubstrateDVM } from '../../utils';
import { EllipsisMiddle } from '../EllipsisMiddle';
import { AssetOverview, AssetOverviewProps } from './AssetOverview';
import { ProgressesProps, State } from './Progress';

const { Panel } = Collapse;

export interface RecordProps extends ProgressesProps {
  blockTimestamp: number;
  recipient: string;
  assets: AssetOverviewProps[];
  departure: ChainConfig | null;
  arrival: ChainConfig | null;
}

const PERCENT_HUNDRED = 100;

function toLocalDateTime(timestamp: number): string {
  const date = fromUnixTime(timestamp);
  const dateAry = date.toString().split(' ');
  const pos = -2;
  const gmt = dateAry[dateAry.length + pos];
  const zonedTime = utcToZonedTime(date, gmt);
  const hour = zonedTime.getUTCHours();
  const minute = zonedTime.getUTCMinutes();
  const sec = zonedTime.getUTCSeconds().toString();
  const zonedTimeStr = `${hour}:${minute}:${sec.length > 1 ? sec : '0' + sec}`;
  const dateStr = date.toLocaleDateString();

  return dateStr + ' ' + zonedTimeStr;
}

export function Record({
  assets,
  recipient,
  blockTimestamp,
  departure,
  arrival,
  items,
  children,
}: PropsWithChildren<RecordProps>) {
  const hasError = useMemo(() => items.find((item) => item.steps.find((step) => step.state === State.error)), [items]);
  const percent = useMemo(() => {
    const total = items.length;
    const finished = items.filter((item) => item.steps.every((step) => step.state !== State.pending));

    return (finished.length / total) * PERCENT_HUNDRED;
  }, [items]);
  const strokeColor = useMemo(() => {
    if (percent === PERCENT_HUNDRED) {
      return '#10b981';
    }
    return hasError ? '#ef4444' : 'normal';
  }, [hasError, percent]);

  if (!blockTimestamp) {
    return null;
  }

  return (
    <Collapse key={blockTimestamp} accordion expandIconPosition="right" className="mb-4">
      <Panel
        header={
          <div className="grid grid-cols-3 gap-0 lg:gap-16">
            <div className="flex gap-4 items-center col-span-3 md:col-span-2 md:mr-8">
              <img className="w-6 md:w-12 mx-auto" src={`/image/${departure?.name}.png`} />

              <div className="relative flex items-center justify-around flex-1 col-span-2 h-12 bg-gray-200 dark:bg-gray-900 bg-opacity-50 record-overview">
                <span>
                  {assets.map((asset, index) => (
                    <AssetOverview key={asset.currency ?? index} {...asset} />
                  ))}
                </span>

                <div className="flex items-center">
                  <RightOutlined className="opacity-30" />
                  <RightOutlined className="opacity-60" />
                  <RightOutlined className="opacity-90" />
                </div>

                <Progress
                  // eslint-disable-next-line no-magic-numbers
                  percent={hasError ? 100 : percent}
                  steps={items.length}
                  showInfo={false}
                  strokeColor={strokeColor}
                  className="w-full absolute bottom-0 records-progress"
                  style={{ width: 'calc(100% - 3rem)' }}
                />
              </div>

              <img className="w-6 md:w-12 mx-auto" src={`/image/${arrival?.name}.png`} />
            </div>

            <div className="flex flex-col justify-between ml-0 md:ml-4 mt-2 md:mt-0 col-span-3 md:col-span-1">
              <span className="flex items-center mb-2">
                <ClockCircleOutlined />
                <span className="ml-2">
                  {/* TODO: fix time format from indexer */}
                  {isSubstrate2SubstrateDVM(chainConfigToVertices(departure!), chainConfigToVertices(arrival!))
                    ? toLocalDateTime(blockTimestamp)
                    : format(fromUnixTime(blockTimestamp), DATE_TIME_FORMATE)}
                </span>
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
