import { LockOutlined, UnlockOutlined, UnorderedListOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout, Menu, Switch as ASwitch, Tooltip } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Connection } from './components/Connection';
import { Footer } from './components/Footer';
import { ThemeSwitch } from './components/ThemeSwitch';
import { THEME } from './config';
import { Path, routes } from './config/routes';
import { useApi } from './hooks';
import { readStorage } from './utils/helper/storage';

const { Header, Content } = Layout;

const navs: { label: string; path: Path | string }[] = [
  { label: 'Cross-chain', path: Path.root },
  { label: 'Token Manager', path: Path.register },
  { label: 'Guide', path: 'xxx' },
];

// eslint-disable-next-line complexity
function App() {
  const { t } = useTranslation();
  const { isDev, enableTestNetworks, setEnableTestNetworks } = useApi();
  const [theme, setTheme] = useState<THEME>(readStorage().theme ?? THEME.DARK);
  const location = useLocation();
  const history = useHistory();
  const net = 'pangolin';

  return (
    <Layout className="min-h-screen overflow-scroll">
      <Header
        className="fixed left-0 right-0 top-0 z-10 flex items-center justify-between sm:px-8 px-2"
        style={{ marginTop: -1 }}
      >
        <div className="flex items-center gap-4">
          <Link to={Path.root}>
            <img src="/image/logo.png" alt="" className="h-4 hidden md:h-6 md:inline-block" />
            <img src="/image/logo-mini.svg" alt="" className="h-16 md:hidden md:h-6 inline-block" />
          </Link>

          <Tooltip title={t('Wormhole is in beta. Please trade at your own risk level')}>
            <WarningOutlined className="md:ml-4 cursor-pointer text-xl" style={{ color: 'yellow' }} />
          </Tooltip>
        </div>

        <div className="flex xl:justify-between lg:justify-end items-center lg:flex-1 ml-2 md:ml-8 lg:ml-24">
          <div className="hidden gap-8 lg:flex light:text-white">
            {navs.map((nav) => (
              <span
                onClick={() => {
                  history.push(nav.path);
                }}
                className={`${
                  nav.path === location.pathname ? 'shadow-mock-bottom-border' : ''
                } transition-all duration-300 ease-in-out text-gray-300 hover:text-gray-100 cursor-pointer`}
                key={nav.label}
              >
                {t(nav.label)}
              </span>
            ))}
          </div>

          <div className="flex justify-end items-center md:pl-8">
            <Connection />

            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item>
                    <Link to={Path.root}>{t('Cross-chain')}</Link>
                  </Menu.Item>
                  <Menu.Item key="submit">
                    <Link to={Path.register}>{t('Token Manager')}</Link>
                  </Menu.Item>
                  <Menu.Item key="guide">
                    <Link to="xxx">{t('Guide')}</Link>
                  </Menu.Item>
                </Menu>
              }
              className="lg:hidden"
            >
              <Button
                type="link"
                icon={<UnorderedListOutlined style={{ color: theme === THEME.LIGHT ? 'white' : 'inherit' }} />}
                size="large"
                className="flex items-center justify-center sm:mx-4"
              ></Button>
            </Dropdown>

            <div className="flex flex-col items-center gap-2">
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

      <Content className="sm:px-16 sm:pt-4 px-2 py-1 my-24 sm:my-20">
        <TransitionGroup>
          <CSSTransition in={true} key={location.key} timeout={300} classNames="fade">
            <Switch location={location}>
              {routes.map((item, index) => (
                <Route key={index} {...item}></Route>
              ))}
            </Switch>
          </CSSTransition>
        </TransitionGroup>
      </Content>

      <Footer theme={theme} />
    </Layout>
  );
}

export default App;
