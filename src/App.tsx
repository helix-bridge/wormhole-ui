import { LockOutlined, UnlockOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, Layout, Menu, Switch as ASwitch, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { ActiveAccount } from './components/ActiveAccount';
import { BridgeStatus } from './components/BridgeStatus';
import { Footer } from './components/Footer';
import { DownIcon } from './components/icons';
import { Nebula } from './components/Nebula';
import { ThemeSwitch } from './components/ThemeSwitch';
import { THEME } from './config';
import { Path, routes } from './config/routes';
import { useApi } from './hooks';
import { readStorage } from './utils/helper/storage';

const { Header, Content } = Layout;

interface Nav {
  label: string;
  path: Path | string;
  extra?: boolean;
  pathGroup?: string[];
}

const crossChain: Nav = { label: 'Cross-chain', path: Path.root };
const erc20Manager: Nav = { label: 'Token Manager', path: Path.register };
const transferRecords: Nav = { label: 'Transfer Records', path: Path.history };

function NavLink({ nav, theme }: { nav: Nav; theme: THEME }) {
  const { t } = useTranslation();
  const history = useHistory();
  const textCls = useMemo(() => (theme === 'dark' ? '' : 'text-pangolin-main'), [theme]);
  const active =
    nav.path === location.pathname || nav?.pathGroup?.includes(location.pathname)
      ? theme === 'dark'
        ? 'shadow-mock-bottom-border-light'
        : 'shadow-mock-bottom-border'
      : '';

  return (
    <div
      onClick={() => {
        if (nav.extra) {
          window.open(nav.path, '_blank');
        } else if (nav.path) {
          history.push(nav.path);
        } else {
          // nothing
        }
      }}
      className={`${active} ${textCls} transition-all duration-300 ease-in-out opacity-100 hover:opacity-80 cursor-pointer`}
      key={nav.label}
    >
      {t(nav.label)}
    </div>
  );
}

function RouteLink({ path, label }: Nav) {
  const { t } = useTranslation();

  return path.includes('http') ? (
    <Typography.Link href={path} target="_blank">
      {t(label)}
    </Typography.Link>
  ) : (
    <Link to={path}>{t(label)}</Link>
  );
}

// eslint-disable-next-line complexity
function App() {
  const { t, i18n } = useTranslation();
  const { enableTestNetworks, setEnableTestNetworks, isDev } = useApi();
  const [theme, setTheme] = useState<THEME>(readStorage().theme ?? THEME.DARK);
  const location = useLocation();
  const guide = useMemo(
    () => ({
      label: 'Guide',
      path: `https://docs.darwinia.network/${i18n.language.startsWith('zh') ? 'zh-CN' : 'en'}/wiki-tut-wormhole`,
      extra: true,
    }),
    [i18n.language]
  );
  const navMenus = useMemo(
    () => (isDev ? [crossChain, transferRecords, erc20Manager, guide] : [crossChain, transferRecords, guide]),
    [isDev, guide]
  );

  return (
    <Layout className="min-h-screen overflow-scroll">
      <Header
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between sm:px-8 px-2"
        style={{ marginTop: -1 }}
      >
        <div className="flex">
          <Link to={Path.root}>
            <img src="/image/logo.svg" alt="" className="h-4 hidden md:h-8 md:inline-block" />
            <img src="/image/logo-mini.svg" alt="" className="h-16 md:hidden md:h-6 inline-block" />
          </Link>

          <Tooltip title={t('Wormhole is in beta. Please use at your own risk level')}>
            <Badge size="small" count={'beta'} className="mt-2"></Badge>
          </Tooltip>
        </div>

        <div className="flex xl:justify-between lg:justify-end items-center lg:flex-1 ml-2 md:ml-8 lg:ml-24">
          <div className="hidden gap-8 lg:flex">
            {navMenus.map((nav, index) =>
              Array.isArray(nav) ? (
                <Dropdown
                  key={index}
                  overlay={
                    <Menu>
                      {nav.slice(1).map((item, idx) => (
                        <Menu.Item key={item.path + '_' + idx}>
                          <RouteLink {...item} />
                        </Menu.Item>
                      ))}
                    </Menu>
                  }
                >
                  <div className="flex items-center">
                    <NavLink nav={nav[0]} theme={theme} />
                    <DownIcon className="ml-2" />
                  </div>
                </Dropdown>
              ) : (
                <NavLink nav={nav} key={index} theme={theme} />
              )
            )}
          </div>

          <div className="flex justify-end items-center md:pl-8">
            <ActiveAccount />

            <Dropdown
              overlay={
                <Menu>
                  {navMenus.map((item, index) => (
                    <Menu.Item key={item.path + '_' + index}>
                      <RouteLink {...item} />
                    </Menu.Item>
                  ))}
                </Menu>
              }
              className="lg:hidden"
            >
              <Button
                type="link"
                icon={<UnorderedListOutlined />}
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
