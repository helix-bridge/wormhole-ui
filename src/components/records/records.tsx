import { Input, Select, Space, Tabs } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NETWORK_GRAPH } from '../../config';
import { RecordsParam } from '../../model';
import { getRecordsParams } from '../../utils';

const { TabPane } = Tabs;
const NETWORKS = [...NETWORK_GRAPH.keys()];

export function Records() {
  const { t } = useTranslation();
  const { search } = useLocation<RecordsParam>();
  const searchParams = useMemo(() => getRecordsParams(search), [search]);
  console.info('%c [ searchParams ]-16', 'font-size:13px; background:pink; color:#bf2c9f;', searchParams);

  return (
    <>
      <Input.Group size="large" className="flex items-center w-full mb-8 select-search">
        <Select size="large" defaultValue={searchParams?.network || NETWORKS[0]} className="capitalize">
          {NETWORKS.map((net) => {
            return (
              <Select.Option value={net} key={net} className="capitalize">
                {net}
              </Select.Option>
            );
          })}
        </Select>

        <Input.Search defaultValue={searchParams?.sender || ''} loading={false} enterButton="Search" size="large" />
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
          <span>In progress extrinsics</span>
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
