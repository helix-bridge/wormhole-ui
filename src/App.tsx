import { EllipsisOutlined, WarningOutlined } from '@ant-design/icons';
import { Affix, Button, Dropdown, Layout, Menu, Tooltip } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Route, Switch, useLocation } from 'react-router-dom';
import { Connection } from './components/Connection';
import { Language } from './components/Language';
import { ThemeSwitch } from './components/ThemeSwitch';
import { THEME } from './config';
import { Path, routes } from './config/routes';
import { useApi } from './hooks';

const { Header, Content } = Layout;

function App() {
  const { t } = useTranslation();
  const { isDev, enableTestNetworks, setEnableTestNetworks } = useApi();
  const location = useLocation();
  const [isAirdrop, setIsAirdrop] = useState<boolean>(location.pathname.includes('airdrop'));
  const [theme, setTheme] = useState<THEME>(THEME.DARK);
  const net = 'pangolin';

  return (
    <Layout style={{ height: '100vh' }} className="overflow-scroll">
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

          <div className="flex justify-end items-center flex-1 md:pl-8">
            <Connection />
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="guide" onClick={() => window.open('', '_blank')}>
                    {t('User Guide')}
                  </Menu.Item>
                  <Menu.Item key="faq" onClick={() => window.open('', '_blank')}>
                    {t('FAQ')}
                  </Menu.Item>
                  <Menu.Item key="submit">
                    <Link to={Path.register}>{t('Submit Your Token')}</Link>
                  </Menu.Item>
                  {!isDev && (
                    <Menu.Item key="tests" onClick={() => setEnableTestNetworks(!enableTestNetworks)}>
                      {t('{{enable}} Test Network', { enable: enableTestNetworks ? 'Disable' : 'Enable' })}
                    </Menu.Item>
                  )}
                  <Menu.Item key="claim">
                    <Link to={isAirdrop ? Path.root : Path.airdrop} onClick={() => setIsAirdrop(!isAirdrop)}>
                      <Button type="primary">{t(isAirdrop ? 'Cross-chain' : 'Claim Airdrop')}</Button>
                    </Link>
                  </Menu.Item>
                </Menu>
              }
            >
              <EllipsisOutlined
                className="text-4xl"
                style={{
                  // color: (net && NETWORK_LIGHT_THEME[net]['@project-main-bg']) || 'inherit',
                  color: '#fff',
                }}
              />
            </Dropdown>

            <ThemeSwitch network={net} defaultTheme={THEME.DARK} onThemeChange={setTheme} />

            <Language mode="text" size="small" network={net} theme={theme} className="ml-4" />
          </div>
        </Header>
      </Affix>

      <Content className="sm:px-16 sm:pt-4 px-2 py-1">
        <Switch>
          {routes.map((item, index) => (
            <Route key={index} {...item}></Route>
          ))}
        </Switch>
      </Content>
    </Layout>
  );
}

export default App;
