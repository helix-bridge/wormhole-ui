import { Dropdown, Menu } from 'antd';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NetConfig } from '../../model';
import { DownIcon } from '../icons';

interface DestinationProps {
  extra?: string | JSX.Element;
  networks: NetConfig[];
  title: string;
  onChange?: (net: NetConfig | null) => void;
  value?: NetConfig | null;
  defaultLogo?: string;
}

export function Destination({
  title,
  extra,
  networks,
  onChange,
  value,
  defaultLogo = 'image/eth-logo.svg',
}: DestinationProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  // const [selected, setSelected] = useState<NetConfig | null>(value ?? null);

  return (
    <div className="sm:col-span-2">
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
            <Menu.Item key="default">{t('Reset Select')}</Menu.Item>
            {networks.map((item) => (
              <Menu.Item key={item.fullName} className="flex justify-between">
                <span className="capitalize mr-2">{item.fullName}</span>
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
          <div className={`rounded-xl flex flex-col gap-4 py-2 flex-1 mr-4 bg-${value?.name}`}>
            <img src={value?.facade.logo || defaultLogo} className="h-8 sm:h-12 md:16 ml-2 self-start" alt="" />
            <span className="capitalize mr-0 text-xs dark:text-white px-2 py-0.5">
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
