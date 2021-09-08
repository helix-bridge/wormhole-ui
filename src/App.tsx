import { LockOutlined, UnlockOutlined, UnorderedListOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout, Menu, Switch as ASwitch, Tooltip } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { BridgeStatus } from './components/BridgeStatus';
import { ActiveAccount } from './components/ActiveAccount';
import { Footer } from './components/Footer';
import { THEME } from './config';
import { Path, routes } from './config/routes';
import { useApi } from './hooks';
import { readStorage } from './utils/helper/storage';
import { Nebula } from './components/Nebula';
import { ThemeSwitch } from './components/ThemeSwitch';
import { DownIcon } from './components/icons';

const { Header, Content } = Layout;

interface Nav {
  label: string;
  path: Path | string;
  pathGroup?: string[];
}

const crossChain: Nav = { label: 'Cross-chain', path: Path.root };
const erc20Manager: Nav = { label: 'Token Manager', path: Path.register };
const transferRecords: Nav = { label: 'Transfer Records', path: Path.history };
const guide: Nav = { label: 'Guide', path: 'xxx' };

function NavLink({ nav }: { nav: Nav }) {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <div
      onClick={() => {
        if (nav.path) {
          history.push(nav.path);
        }
      }}
      className={`${
        nav.path === location.pathname || nav?.pathGroup?.includes(location.pathname) ? 'shadow-mock-bottom-border' : ''
      } transition-all duration-300 ease-in-out text-gray-300 hover:text-gray-100 cursor-pointer`}
      key={nav.label}
    >
      {t(nav.label)}
    </div>
  );
}

// eslint-disable-next-line complexity
function App() {
  const { t } = useTranslation();
  const { enableTestNetworks, setEnableTestNetworks, isDev } = useApi();
  const [theme, setTheme] = useState<THEME>(readStorage().theme ?? THEME.DARK);
  const location = useLocation();
  const navMenus = useMemo(
    () => (isDev ? [crossChain, transferRecords, erc20Manager, guide] : [crossChain, transferRecords]),
    [isDev]
  );

  return (
    <Layout className="min-h-screen overflow-scroll">
      <Header
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between sm:px-8 px-2"
        style={{ marginTop: -1 }}
      >
        <div className="flex items-center gap-4">
          <Link to={Path.root}>
            <img src="/image/logo.svg" alt="" className="h-4 hidden md:h-8 md:inline-block" />
            <img src="/image/logo-mini.svg" alt="" className="h-16 md:hidden md:h-6 inline-block" />
          </Link>

          <Tooltip title={t('Wormhole is in beta. Please trade at your own risk level')}>
            <WarningOutlined className="md:ml-4 cursor-pointer text-xl" style={{ color: 'yellow' }} />
          </Tooltip>
        </div>

        <div className="flex xl:justify-between lg:justify-end items-center lg:flex-1 ml-2 md:ml-8 lg:ml-24">
          <div className="hidden gap-8 lg:flex light:text-white">
            {navMenus.map((nav, index) =>
              Array.isArray(nav) ? (
                <Dropdown
                  key={index}
                  overlay={
                    <Menu>
                      {nav.slice(1).map((item) => (
                        <Menu.Item key={item.path}>
                          <Link to={item.path}>{t(item.label)}</Link>
                        </Menu.Item>
                      ))}
                    </Menu>
                  }
                >
                  <div className="flex items-center">
                    <NavLink nav={nav[0]} />
                    <DownIcon className="ml-2" />
                  </div>
                </Dropdown>
              ) : (
                <NavLink nav={nav} key={index} />
              )
            )}
          </div>

          <div className="flex justify-end items-center md:pl-8">
            <ActiveAccount />

            <Dropdown
              overlay={
                <Menu>
                  {navMenus.map((item) => (
                    <Menu.Item key={item.path}>
                      <Link to={item.path}>{t(item.label)}</Link>
                    </Menu.Item>
                  ))}
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
                className="mx-4"
                style={{
                  lineHeight: 0.5,
                  background: theme === THEME.DARK ? undefined : enableTestNetworks ? 'rgba(0,0,0,.5)' : undefined,
                }}
              />
            </Tooltip>

            <ThemeSwitch defaultTheme={THEME.DARK} onThemeChange={setTheme} mode="btn" />
          </div>
        </div>
      </Header>

      <Content className="sm:px-16 sm:pt-4 px-2 py-1 my-24 sm:my-20 z-10">
        <BridgeStatus className="xl:w-1/3 lg:1/2 md:w-2/3 w-full mx-auto drop-shadow max-w-full mb-8" />
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

      {theme === THEME.DARK && !isDev && <Nebula />}
    </Layout>
  );
}

export default App;
