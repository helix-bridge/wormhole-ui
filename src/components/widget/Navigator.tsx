import { Dropdown, Menu, Typography } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory } from 'react-router-dom';
import { Path } from '../../config/constant';
import { THEME } from '../../config/theme';
import { DownIcon } from '../icons';

export interface Nav {
  label: string;
  path: Path | string;
  extra?: boolean;
  hide?: boolean;
}

export interface NavigatorProps {
  data: Nav[];
  theme?: THEME;
}

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

export function Navigator({ data, theme = THEME.DARK }: NavigatorProps) {
  return (
    <>
      {data.map((nav, index) =>
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
    </>
  );
}
