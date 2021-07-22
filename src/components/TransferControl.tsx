import { ArrowRightOutlined } from '@ant-design/icons';
import { Badge, Dropdown, Menu } from 'antd';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Network } from '../config';
import { useApi } from '../hooks';
import { AccountType, NetworkType } from '../model';
import { DownIcon } from './icons';

export interface TransferValue {
  from?: string;
  to?: string;
}

interface AccountProps {
  accountType: AccountType;
  title: string;
  extra?: string | JSX.Element;
}

const networks: NetworkType[] = [Network.darwinia, Network.crab, Network.pangolin];

export function AccountGrid({ title, extra }: AccountProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { networkConfig, network } = useApi();
  const { t } = useTranslation();

  return (
    <div className="sm:col-span-2">
      <p className="mb-2">{title}</p>
      <Dropdown
        trigger={['click']}
        className="relative cursor-pointer"
        overlay={
          <Menu
            onClick={() => {
              //
            }}
          >
            {networks.map((item) => (
              <Menu.Item key={item} className="flex justify-between">
                <span className="capitalize mr-2">{t(item)}</span>
              </Menu.Item>
            ))}
          </Menu>
        }
      >
        <div
          ref={panelRef}
          className={
            'flex items-center justify-between text-lg px-1 pt-4 pb-2 rounded-xl bg-gray-100 dark:bg-gray-800 max-w-full'
          }
        >
          <div className={`rounded-xl flex flex-col pb-1 bg-${network}`}>
            <img
              src={networkConfig?.facade.logo || 'image/eth-logo.svg'}
              className="h-8 sm:h-12 md:16 ml-2 self-start"
              alt=""
            />
            <span className="capitalize mr-0 text-xs dark:text-white px-2 py-0.5 mt-4">Ethereum Network</span>
          </div>

          <DownIcon className="mr-2 mb-2 self-end rounded-sm dark:bg-gray-600 dark:text-white" />

          <div className="absolute top-2 right-2">{extra}</div>
        </div>
      </Dropdown>
    </div>
  );
}

export function TransferControl() {
  const { t } = useTranslation();
  const accountType = 'smart';

  return (
    <>
      <div className="flex sm:grid sm:grid-cols-5 justify-between items-center">
        <AccountGrid
          accountType={accountType}
          title={t('From')}
          extra={<Badge color="#87d068" text={t('unconnected')} />}
        />

        <ArrowRightOutlined className="mt-6 text-2xl" />

        <AccountGrid accountType={'smart'} title={t('To')} />
      </div>

      {/* <SwitchWalletModal
        cancel={() => setIsWalletSwitcherVisible(false)}
        confirm={() => {
          switchAccountType(toOppositeAccountType(accountType));
          setAccount(null);
        }}
        isVisible={isWalletSwitcherVisible}
      /> */}
    </>
  );
}
