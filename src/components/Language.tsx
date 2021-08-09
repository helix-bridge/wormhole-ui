import { Button, Dropdown, Menu } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NETWORK_LIGHT_THEME } from '../config';
import { Network } from '../model';
import { readStorage } from '../utils/helper/storage';
import { EarthIcon } from './icons';

export interface LanguageProps {
  className?: string;
  network?: Network;
  simpleMode?: boolean;
}

const lang: { name: string; short: string }[] = [
  { name: '中文', short: 'zh' },
  { name: 'English', short: 'en' },
];

// eslint-disable-next-line complexity
export function Language({ network, simpleMode = false, className = '' }: LanguageProps) {
  const { t, i18n } = useTranslation();
  const [current, setCurrent] = useState(i18n.language.includes('-') ? i18n.language.split('-')[0] : i18n.language);
  const textColor = useMemo(() => (network ? 'text-' + network + '-main' : ''), [network]);
  const color = readStorage().theme === 'dark' ? network && NETWORK_LIGHT_THEME[network]['@project-main-bg'] : '#fff';

  return (
    <Dropdown
      overlay={
        <Menu>
          {lang.map((item) => (
            <Menu.Item
              onClick={() => {
                if (current !== item.name) {
                  setCurrent(item.short);
                  i18n.changeLanguage(item.short);
                }
              }}
              key={item.short}
            >
              {t(item.name)}
            </Menu.Item>
          ))}
        </Menu>
      }
      className={className}
    >
      {simpleMode ? (
        <EarthIcon style={{ color }} className="cursor-pointer" />
      ) : (
        <Button
          className={`${textColor} flex items-center justify-around uppercase`}
          icon={<EarthIcon style={{ color }} />}
        >
          <span className={textColor}>{current}</span>
        </Button>
      )}
    </Dropdown>
  );
}
