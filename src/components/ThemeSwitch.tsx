import { BgColorsOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, Switch, SwitchProps } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NETWORK_DARK_THEME, NETWORK_LIGHT_THEME, SKIN_THEME, THEME } from '../config';
import { Network } from '../model';
import { readStorage, updateStorage } from '../utils/helper/storage';

export const toggleTheme = (theme: THEME, network: Network = 'pangolin') => {
  const networkTheme = theme === THEME.DARK ? NETWORK_DARK_THEME : NETWORK_LIGHT_THEME;

  window.less
    .modifyVars({
      ...SKIN_THEME[theme],
      ...SKIN_THEME.vars,
      ...networkTheme[network],
    })
    .then(() => {
      updateStorage({ theme });
      // Do not read theme from localStorage other than this file. Use readStorage instead.
      localStorage.setItem('theme', theme);
    });
};

export interface ThemeSwitchProps extends SwitchProps {
  network?: Network;
  defaultTheme?: THEME;
  onThemeChange?: (theme: THEME) => void;
  mode?: 'switcher' | 'btn';
}

// eslint-disable-next-line complexity
export function ThemeSwitch({
  network,
  mode = 'switcher',
  onThemeChange,
  defaultTheme = THEME.LIGHT,
  className,
  ...others
}: ThemeSwitchProps) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<THEME>(readStorage()?.theme || defaultTheme);

  useEffect(() => {
    toggleTheme(theme, network);

    if (theme === THEME.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [network, theme]);

  return mode === 'switcher' ? (
    <Switch
      {...others}
      checked={theme === THEME.DARK}
      checkedChildren="🌙"
      unCheckedChildren="☀️"
      onChange={() => {
        const current = theme === THEME.DARK ? THEME.LIGHT : THEME.DARK;

        setTheme(current);

        if (onThemeChange) {
          onThemeChange(current);
        }
      }}
      className={className}
    />
  ) : (
    <Dropdown
      overlay={
        <Menu>
          {[{ theme: THEME.LIGHT }, { theme: THEME.DARK }].map((item) => (
            <Menu.Item
              onClick={() => {
                if (item.theme !== theme) {
                  const current = item.theme;

                  setTheme(current);

                  if (onThemeChange) {
                    onThemeChange(current);
                  }
                }
              }}
              key={item.theme}
            >
              {t(item.theme)}
            </Menu.Item>
          ))}
        </Menu>
      }
    >
      <Button
        type="ghost"
        icon={<BgColorsOutlined width={22} className="text-xl" />}
        className={className + ' flex items-center justify-center'}
      ></Button>
    </Dropdown>
  );
}
