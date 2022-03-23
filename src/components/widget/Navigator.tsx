import { Dropdown, Menu, Typography } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useApi } from '../../hooks';
import { DownIcon } from '../icons';
import { IconProps } from '../icons/icon-factory';
import { Path, routes, THEME } from '../../config';

export interface Nav {
  label: string;
  path: Path | string;
  extra?: boolean;
  hide?: boolean;
  Icon?: (Props: IconProps) => JSX.Element;
  className?: string;
}

export interface NavigatorProps {
  theme?: THEME;
  toggle?: () => void;
}

const navigators: Nav[] = [
  { label: 'Dashboard', path: Path.dashboard },
  { label: 'Explorer', path: Path.explorer },
  { label: 'DAO', path: Path.register },
  { label: 'Docs', path: 'https://docs.darwinia.network/tutorials/wiki-tut-wormhole', extra: true },
];

export function NavLink({ nav, theme }: { nav: Nav; theme: THEME }) {
  const { t } = useTranslation();
  const history = useHistory();
  const textCls = useMemo(() => (theme === 'dark' ? '' : 'text-pangolin-main'), [theme]);
  const active =
    nav.path === location.pathname
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
      className={`${active} ${textCls} transition-all duration-300 ease-in-out opacity-100 hover:opacity-80 cursor-pointer whitespace-nowrap`}
      key={nav.label}
    >
      {t(nav.label)}
    </div>
  );
}

export function RouteLink({ path, label }: Nav) {
  const { t } = useTranslation();

  return path.includes('http') ? (
    <Typography.Link href={path} target="_blank">
      {t(label)}
    </Typography.Link>
  ) : (
    <Link to={path}>{t(label)}</Link>
  );
}

export const getActiveNav = (path: string) => {
  return routes
    .filter((item) => path === item.path)
    .map((item) => {
      const urlPath = item.path === Path.root ? Path.dashboard : (item.path as string);

      return navigators.find((nav) => nav.path.startsWith(urlPath));
    })
    .filter((item) => !!item) as Nav[];
};

export function Navigator({ toggle, theme = THEME.DARK }: NavigatorProps) {
  const { t } = useTranslation();
  const { isDev } = useApi();
  const location = useLocation();
  const navs = useMemo(() => navigators.filter((item) => isDev || (!isDev && !item.hide)), [isDev]);

  const selectedNavMenu = useMemo<string[]>(() => {
    const nav = getActiveNav(location.pathname);

    return [nav.length ? nav[0].path : ''];
  }, [location?.pathname]);

  return (
    <>
      <div className="hidden lg:block">
        {navs.map((nav, index) =>
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

      <Menu
        theme={theme}
        mode="inline"
        defaultSelectedKeys={selectedNavMenu}
        className="flex-1"
        style={{ background: theme === THEME.DARK ? 'transparent' : 'inherit' }}
      >
        {navigators.map(({ Icon, path, label, className }) => (
          <Menu.Item
            icon={Icon ? <Icon /> : null}
            key={path}
            className={className}
            onClick={() => {
              if (toggle) {
                toggle();
              }
            }}
          >
            <Link to={path}>{t(label)}</Link>
          </Menu.Item>
        ))}
      </Menu>
    </>
  );
}
