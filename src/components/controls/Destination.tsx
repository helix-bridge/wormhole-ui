import { Dropdown, Menu, Tag } from 'antd';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NetConfig } from '../../model';
import { DownIcon } from '../icons';

interface DestinationProps {
  extra?: string | JSX.Element;
  networks: NetConfig[];
  title?: string;
  onChange?: (net: NetConfig | null) => void;
  value?: NetConfig | null;
  defaultLogo?: string;
  animationRandom?: number | null;
}

export function Destination({
  title,
  extra,
  networks,
  onChange,
  value,
  defaultLogo = 'image/network.png',
  animationRandom: animationRadom = null,
}: DestinationProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const whirl = 'animate-whirl';
  const whirlReverse = 'animate-whirl-reverse';

  useEffect(() => {
    const textRef = panelRef.current?.querySelector(`.bg-${value?.name}`);

    panelRef.current?.classList.remove(whirl);
    textRef?.classList.remove(whirlReverse);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        panelRef.current?.classList.add(whirl);
        textRef?.classList.add(whirlReverse);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationRadom]);

  return (
    <div className="flex-1">
      <p className="mb-2">{title}</p>
      <Dropdown
        trigger={['click']}
        className="relative cursor-pointer"
        overlay={
          <Menu
            onClick={({ key }) => {
              const target = networks.find((net) => net.fullName === key) ?? null;

              if (onChange) {
                onChange(target);
              }
            }}
          >
            <Menu.Item key="default">{t('Clear Selected')}</Menu.Item>
            {networks.map((item) => (
              <Menu.Item key={item.fullName}>
                <span className="flex justify-between items-center">
                  <span className="capitalize mr-2">{item.fullName}</span>
                  {item.isTest && <Tag color="cyan">{t('Test')}</Tag>}
                </span>
              </Menu.Item>
            ))}
          </Menu>
        }
      >
        <div
          ref={panelRef}
          className={
            'flex items-center justify-between text-lg p-2 pr-1 rounded-xl bg-gray-300 dark:bg-gray-800 max-w-full text-white'
          }
        >
          <div className={`rounded-xl flex flex-col gap-4 py-2 flex-1 mr-1 md:mr-4 bg-${value?.name}`}>
            <img src={value?.facade.logo || defaultLogo} className="h-8 sm:h-12 md:16 ml-2 self-start" alt="" />
            <span className="capitalize mr-0 text-xs dark:text-white px-2 py-0.5 whitespace-nowrap">
              {!value ? t('Select Network') : value.fullName}
            </span>
          </div>

          <div className="flex flex-col gap-4 justify-between self-stretch pb-3 pr-2">
            <div className="flex">{extra}</div>
            <DownIcon className="flex self-end rounded-sm bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-white" />
          </div>
        </div>
      </Dropdown>
    </div>
  );
}
