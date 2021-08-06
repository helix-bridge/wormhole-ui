import { ClockCircleOutlined, ImportOutlined, RightOutlined } from '@ant-design/icons';
import { encodeAddress } from '@polkadot//util-crypto';
import { Collapse, Progress, Tooltip, Typography } from 'antd';
import { format } from 'date-fns';
import { fromUnixTime } from 'date-fns/esm';
import { useTranslation } from 'react-i18next';
import { NetConfig } from '../../model';
import { RedeemRecord, RingBurnRecord } from '../../model/darwinia';
import { fromWei, prettyNumber } from '../../utils';
import { getDepositTimeRange } from '../controls/DepositItem';
import { EllipsisMiddle } from '../ShortAccount';

interface RecordProps {
  record: RedeemRecord | RingBurnRecord;
  network: NetConfig | null;
}

const { Panel } = Collapse;

const DATE_FORMAT = 'yyyy/MM/dd';

const DATE_TIME_FORMATE = 'yyyy/MM/dd hh:mm:ss';

// eslint-disable-next-line complexity
export function Record({ record, network }: RecordProps) {
  const { address, chain, amount, currency, target, block_timestamp } = record;
  const decimal = network?.ss58Prefix ?? 0;

  return (
    <Collapse key={address} accordion expandIconPosition="right" className="mb-4">
      <Panel
        header={
          <div className="grid grid-cols-3 gap-0 lg:gap-16">
            <div className="flex gap-4 items-center col-span-3 md:col-span-2 md:mr-8">
              <img className="w-6 md:w-12 mx-auto" src={`/image/${chain.toLowerCase()}-logo.svg`} />

              <div className="relative flex items-center justify-around flex-1 col-span-2 h-12 bg-gray-900 bg-opacity-50">
                <AssetOverview
                  amount={amount}
                  deposit={JSON.parse((record as RedeemRecord).deposit || '{}')}
                  currency={currency}
                />

                <div className="flex items-center arrow-panel">
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

              <img className="w-6 md:w-12 mx-auto" src={`/image/darwinia-button-mobile.png`} />
            </div>

            <div className="flex flex-col justify-between ml-0 md:ml-4 mt-2 md:mt-0 col-span-3 md:col-span-1">
              <span className="flex items-center mb-2">
                <ClockCircleOutlined />
                <span className="ml-2">{format(fromUnixTime(+block_timestamp), DATE_TIME_FORMATE)}</span>
              </span>

              <span className="w-full flex items-center">
                <Tooltip
                  title={target.startsWith('0x') ? target : encodeAddress('0x' + target, decimal)}
                  placement="top"
                >
                  <ImportOutlined style={{ transform: 'rotateY(180deg)' }} className="mr-2" />
                </Tooltip>

                <EllipsisMiddle className="flex items-center text-right">
                  {target.startsWith('0x') ? target : encodeAddress('0x' + target, decimal)}
                </EllipsisMiddle>
              </span>
            </div>
          </div>
        }
        key={address}
        className="overflow-hidden"
      >
        {/* <MemberList data={account} statusRender={(pair) => renderMemberStatus(data, pair)} /> */}
      </Panel>
    </Collapse>
  );
}

function AssetOverview({
  amount,
  deposit,
  currency,
}: {
  amount: string;
  deposit?: { start: number; month: number; deposit_id: string };
  currency: string;
}) {
  const { t } = useTranslation();
  const depositFlag = 'DEPOSIT';

  if (currency.toUpperCase() === depositFlag) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { deposit_id, start, month } = deposit!;
    const { start: startTime, end: endTime } = getDepositTimeRange({ deposit_time: start, duration: month });

    return (
      <Typography.Text>
        <span>{deposit_id}</span>
        <p>
          {fromWei({ value: amount }, prettyNumber)} RING ({t('Time')}: {format(startTime, DATE_FORMAT)} -{' '}
          {format(endTime, DATE_FORMAT)})
        </p>
      </Typography.Text>
    );
  }

  return (
    <Typography.Text>
      <span className="mr-4">{fromWei({ value: amount, unit: 'ether' }, prettyNumber)}</span>
      <span className="uppercase">{currency}</span>
    </Typography.Text>
  );
}
