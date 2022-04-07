import { MenuOutlined } from '@ant-design/icons';
import { Button, Drawer, Layout, Tooltip } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Route, Switch, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { BridgeState } from './components/bridge/BridgeState';
import { Navigator } from './components/widget/Navigator';
import { ThemeSwitch } from './components/widget/ThemeSwitch';
import { Path } from './config/constant';
import { routes } from './config/routes';
import { THEME } from './config/theme';
import { readStorage } from './utils/helper/storage';

const { Header, Content } = Layout;

// eslint-disable-next-line complexity
function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<THEME>(readStorage().theme ?? THEME.DARK);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Layout className="min-h-screen overflow-scroll">
      <Header
        className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between sm:px-8 px-4 border-b"
        style={{ marginTop: -1, borderColor: '#113b5d' }}
      >
        <Tooltip title={t('Wormhole is in beta. Please use at your own risk level')}>
          <Link to={Path.root}>
            <img src="/image/bridges/helix.png" width={90} height={24} />
          </Link>
        </Tooltip>

        <Drawer
          placement="right"
          onClose={() => setCollapsed(true)}
          closable={false}
          visible={!collapsed}
          bodyStyle={{ padding: 0 }}
          className="block lg:hidden"
        >
          <Navigator theme={theme} toggle={() => setCollapsed(true)} />
        </Drawer>

        <div onClick={() => setCollapsed(false)} className="block lg:hidden">
          <MenuOutlined className="text-xl" />
        </div>

        <div className="hidden lg:flex lg:justify-end items-center lg:flex-1 ml-2 md:ml-8 lg:ml-12">
          <Navigator theme={theme} />

          <Button type="primary" size="large" className="ml-8">
            {t('Launch App')}
          </Button>

          <div className="justify-end items-center md:pl-8 hidden">
            <ThemeSwitch defaultTheme={THEME.DARK} onThemeChange={setTheme} mode="btn" />
          </div>
        </div>
      </Header>

      <Content className="sm:px-16 sm:pt-4 px-4 py-1 my-24 sm:my-20">
        <BridgeState />
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
    </Layout>
  );
}

export default App;
