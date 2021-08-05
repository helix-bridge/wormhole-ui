import { RightOutlined } from '@ant-design/icons';
import { encodeAddress } from '@polkadot//util-crypto';
import { Collapse, Empty, Progress, Space, Tooltip, Typography } from 'antd';
import { format } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';
import { RedeemRecord, RingBurnRecord } from '../../model/darwinia';
import { fromWei, prettyNumber } from '../../utils';
import { getDepositTimeRange } from '../controls/DepositItem';
import { EllipsisMiddle } from '../ShortAccount';

const { Panel } = Collapse;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Record({ source }: { source: (RedeemRecord | RingBurnRecord)[] }) {
  return (
    <Space direction="vertical" className="w-full">
      {source.map((data) => {
        const { address, chain, amount, currency, target } = data;
        const decimal = 18;

        return (
          <Collapse key={address} expandIconPosition="right" className="mb-4">
            <Panel
              header={
                <div className="grid grid-cols-2 gap-16">
                  <div className="grid grid-cols-4 items-center mr-8">
                    <Point name={chain} logo={`/image/${chain.toLowerCase()}-logo.svg`}></Point>
                    <div className="flex items-center justify-around col-span-2 flex-1 h-full bg-gray-900 rounded-3xl lg:px-8">
                      {/* <div className="w-full px-4 h-px relative bg-gray-300 mx-auto my-2 swap-right"></div> */}
                      <div>
                        {currency.toUpperCase() === 'DEPOSIT' ? (
                          <DepositHistoryDetail
                            amount={amount}
                            deposit={JSON.parse((data as RedeemRecord).deposit || '{}')}
                          />
                        ) : (
                          <Typography.Text>
                            <span className="mr-4">{fromWei({ value: amount, unit: 'ether' }, prettyNumber)}</span>
                            <span className="uppercase">{currency}</span>
                          </Typography.Text>
                        )}
                      </div>
                      <div className="flex items-center arrow-panel">
                        <RightOutlined className="opacity-30" />
                        <RightOutlined className="opacity-60" />
                        <RightOutlined className="opacity-90" />
                      </div>
                    </div>
                    <Point name="darwinia"></Point>
                  </div>

                  <div className="flex flex-col justify-between">
                    <span className="w-full flex items-center justify-center">
                      <span className="w-28">
                        <Trans>Recipient: </Trans>
                      </span>

                      <Tooltip
                        title={target.startsWith('0x') ? target : encodeAddress('0x' + target, decimal)}
                        placement="top"
                      >
                        <EllipsisMiddle>
                          {target.startsWith('0x') ? target : encodeAddress('0x' + target, decimal)}
                        </EllipsisMiddle>
                      </Tooltip>
                    </span>

                    <Tooltip placement="right" title={<Trans>Transfer progress percent</Trans>}>
                      <Progress percent={50} steps={4} className="w-full ml-12 records-progress" />
                    </Tooltip>
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
      })}

      {!source.length && <Empty />}
    </Space>
  );
}

function DepositHistoryDetail({
  amount,
  deposit,
}: {
  amount: string;
  deposit: { start: number; month: number; deposit_id: string };
}) {
  const { t } = useTranslation();

  if (!deposit) {
    return null;
  }

  const { start, end } = getDepositTimeRange({ deposit_time: deposit.start, duration: deposit.month });

  return (
    <Typography.Text>
      <span>{deposit.deposit_id}</span>
      <p>
        {fromWei({ value: amount }, prettyNumber)} RING ({t('Time')}: {format(start, 'YYYY/MM/DD')} -{' '}
        {format(end, 'YYYY/MM/DD')})
      </p>
    </Typography.Text>
  );
}

function Point({ name, logo }: { name: string; logo?: string; className?: string }) {
  return <img className="w-6 md:w-12 mx-auto" src={logo || `/image/${name.toLowerCase()}-button-mobile.png`} />;
}
