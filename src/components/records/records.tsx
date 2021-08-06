import { Empty, Input, Select, Space, Tabs } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NETWORK_CONFIG, NETWORK_GRAPH } from '../../config';
import { useEthereumRecords } from '../../hooks';
import { HistoryRouteParam } from '../../model';
import { getHistoryRouteParams } from '../../utils';
import { Record } from './Record';

const { TabPane } = Tabs;
const NETWORKS = [...NETWORK_GRAPH.keys()];

// eslint-disable-next-line complexity
export function Records() {
  const { t } = useTranslation();
  const { search } = useLocation<HistoryRouteParam>();
  const searchParams = useMemo(() => getHistoryRouteParams(search), [search]);
  const [network, setNetwork] = useState(searchParams.network);
  const [address, setAddress] = useState(searchParams.sender);
  const { data, loading } = useEthereumRecords(network, address);

  return (
    <>
      <Input.Group size="large" className="flex items-center w-full mb-8 select-search">
        <Select
          size="large"
          defaultValue={searchParams?.network || NETWORKS[0]}
          className="capitalize"
          onSelect={(value) => {
            console.info('%c [ value ]-40', 'font-size:13px; background:pink; color:#bf2c9f;', value);
            setNetwork(value);
          }}
        >
          {NETWORKS.map((net) => {
            return (
              <Select.Option value={net} key={net} className="capitalize">
                {net}
              </Select.Option>
            );
          })}
        </Select>

        <Input.Search
          defaultValue={searchParams?.sender || ''}
          loading={loading}
          onSearch={(value) => {
            console.info('%c [ value ]-53', 'font-size:13px; background:pink; color:#bf2c9f;', value);
            setAddress(value);
          }}
          enterButton="Search"
          size="large"
        />
      </Input.Group>

      <Tabs defaultActiveKey={searchParams?.state || 'inprogress'}>
        <TabPane
          tab={
            <Space>
              <span>{t('In Progress')}</span>
              <span>In progress number</span>
            </Space>
          }
          key="inprogress"
        >
          {(data || []).map((item) => (
            <Record record={item} network={NETWORK_CONFIG[network || 'ethereum']} key={item.block_timestamp} />
          ))}

          {!data || (!data.length && <Empty />)}
        </TabPane>
        <TabPane
          tab={
            <Space>
              <span>{t('Confirmed Extrinsic')}</span>
              <span>confirmed number</span>
            </Space>
          }
          key="confirmed"
        >
          <span>confirmed extrinsics</span>
        </TabPane>
      </Tabs>
    </>
  );
}
