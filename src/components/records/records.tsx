import { Input, Select, Space, Tabs } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NETWORK_GRAPH } from '../../config';
import { RecordsParam } from '../../model';

const { TabPane } = Tabs;
const NETWORKS = [...NETWORK_GRAPH.keys()];

export function Records() {
  const { t } = useTranslation();
  const { search } = useLocation<RecordsParam>();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  console.info(
    '%c [  network, sender, state  ]-6',
    'font-size:13px; background:pink; color:#bf2c9f;',
    searchParams.get('network'),
    searchParams.get('sender'),
    searchParams.get('state')
  );
  return (
    <>
      <Input.Group size="large" className="flex items-center w-full mb-8 select-search">
        <Select size="large" defaultValue={NETWORKS[0]} className="capitalize">
          {NETWORKS.map((net) => {
            return (
              <Select.Option value={net} key={net} className="capitalize">
                {net}
              </Select.Option>
            );
          })}
        </Select>

        <Input.Search loading={false} enterButton="Search" size="large" />
      </Input.Group>

      <Tabs>
        <TabPane
          tab={
            <Space>
              <span>{t('In Progress')}</span>
              <span>{}</span>
            </Space>
          }
          key="inProgress"
        >
          {/* {multisigAccount?.address ? (
            <Entries source={inProgress} account={multisigAccount} />
          ) : (
            <Spin className="w-full mt-4" />
          )} */}
        </TabPane>
        <TabPane
          tab={
            <Space>
              <span>{t('Confirmed Extrinsic')}</span>
              {/* <span>{data?.transfers.totalCount ?? 0}</span> */}
            </Space>
          }
          key="confirmed"
        >
          {/* <Confirmed account={multisigAccount} multiAddress={multiAddress} /> */}
        </TabPane>
      </Tabs>
    </>
  );
}
