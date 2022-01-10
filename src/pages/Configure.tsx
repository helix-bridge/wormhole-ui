import { Card, Layout, Menu } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { Configuration } from '../components/Configuration';
import { NETWORK_CONFIGURATIONS } from '../config';
import { Network } from '../model';

const { Sider, Content } = Layout;
const DEFAULT_ACTIVE: Network = 'darwinia';

function Config() {
  const { t } = useTranslation();
  const [active, setActive] = useState(DEFAULT_ACTIVE);

  return (
    <Card
      title={t('Configuration')}
      style={{ height: 'calc(100vh - 64px - 64px)' }}
      headStyle={{ position: 'sticky', top: '0' }}
      bodyStyle={{ height: 'calc(100vh - 64px - 64px - 58px)', padding: 0 }}
      className="lg:w-1/2 w-full mx-auto dark:shadow-none dark:border-transparent overflow-hidden"
    >
      <Layout className="h-full">
        <Sider width={100} className="h-full overflow-scroll">
          <Menu mode="vertical" defaultSelectedKeys={['darwinia']} className="min-h-full">
            {NETWORK_CONFIGURATIONS.map((item) => (
              <Menu.Item
                onClick={(value) => {
                  setActive(value.key as Network);
                }}
                key={item.name}
                className="capitalize"
              >
                {item.name}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <Content className="p-2 overflow-scroll bg-gray-200 dark:bg-gray-900">
          <Configuration network={active} />
        </Content>
      </Layout>
    </Card>
  );
}

export const Configure = withRouter(Config);
