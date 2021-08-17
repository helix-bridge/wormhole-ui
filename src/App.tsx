import { LockOutlined, UnlockOutlined, UnorderedListOutlined, WarningOutlined } from '@ant-design/icons';
import { Affix, Button, Dropdown, Layout, Menu, Switch as ASwitch, Tooltip } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Route, Switch } from 'react-router-dom';
import { Connection } from './components/Connection';
import { Footer } from './components/Footer';
import { ThemeSwitch } from './components/ThemeSwitch';
import { THEME } from './config';
import { Path, routes } from './config/routes';
import { useApi } from './hooks';

const { Header, Content } = Layout;

// eslint-disable-next-line complexity
function App() {
  const { t } = useTranslation();
  const { isDev, enableTestNetworks, setEnableTestNetworks } = useApi();
  const [theme, setTheme] = useState<THEME>(THEME.DARK);
  const net = 'pangolin';

  return (
    <Layout style={{ height: 'calc(100vh - 74px)' }} className="overflow-scroll">
      <Affix offsetTop={1}>
        <Header className="flex items-center justify-between sm:px-8 px-2" style={{ marginTop: -1 }}>
          <div className="flex items-center gap-4">
            <Link to={Path.root}>
              <img src="/image/logo.png" alt="" className="h-4 md:h-6" />
            </Link>
            <span className="text-white text-md whitespace-nowrap md:inline hidden">{t('Cross-chain transfer')}</span>

            <Tooltip title={t('Wormhole is in beta. Please trade at your own risk level')}>
              <WarningOutlined className="ml-4 cursor-pointer text-xl" style={{ color: 'yellow' }} />
            </Tooltip>
          </div>

          <div className="flex xl:justify-between lg:justify-end items-center flex-1 ml-32">
            <div className="hidden gap-8 xl:flex">
              <Link to="xxx">{t('Guide')}</Link>
              <Link to={Path.register}>{t('Token Manager')}</Link>
              <Link to={Path.airdrop}>{t('Airdrop')}</Link>
            </div>

            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="guide">
                    <Link to="xxx">{t('Guide')}</Link>
                  </Menu.Item>
                  <Menu.Item key="submit">
                    <Link to={Path.register}>{t('Token Manager')}</Link>
                  </Menu.Item>
                  <Menu.Item key="claim">
                    <Link to={Path.airdrop}>{t('Airdrop')}</Link>
                  </Menu.Item>
                </Menu>
              }
              className="xl:hidden"
            >
              <Button type="link" icon={<UnorderedListOutlined />} size="large"></Button>
            </Dropdown>

            <div className="flex justify-end items-center md:pl-8">
              <Connection />

              <div className="flex flex-col items-center gap-2 ml-4">
                {!isDev && (
                  <Tooltip
                    title={t('{{enable}} the test networks to appear in the network selection panel', {
                      enable: enableTestNetworks ? t('Disable') : t('Enable'),
                    })}
                  >
                    <ASwitch
                      onChange={() => setEnableTestNetworks(!enableTestNetworks)}
                      checked={enableTestNetworks}
                      checkedChildren={<UnlockOutlined />}
                      unCheckedChildren={<LockOutlined />}
                      size="small"
                      className="w-12"
                      style={{ lineHeight: 0.5 }}
                    />
                  </Tooltip>
                )}

                <ThemeSwitch
                  size="small"
                  network={net}
                  defaultTheme={THEME.DARK}
                  onThemeChange={setTheme}
                  className="w-12"
                />
              </div>
            </div>
          </div>
        </Header>
      </Affix>

      <Content className="sm:px-16 sm:pt-4 px-2 py-1 my-12 sm:my-6">
        <Switch>
          {routes.map((item, index) => (
            <Route key={index} {...item}></Route>
          ))}
        </Switch>
      </Content>

      <Footer theme={theme} />
    </Layout>
  );
}

export default App;
