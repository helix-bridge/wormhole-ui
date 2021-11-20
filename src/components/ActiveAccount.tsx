import React, { CSSProperties, useMemo } from 'react';
import { useApi } from '../hooks';
import { getDisplayName, getNetworkMode, isEthereumNetwork, isPolkadotNetwork, isTronNetwork } from '../utils';
import { EllipsisMiddle } from './EllipsisMiddle';

interface ActiveAccountProps {
  isLargeRounded?: boolean;
  logoStyle?: CSSProperties;
  containerStyle?: CSSProperties;
  className?: string;
  textClassName?: string;
  onClick?: () => void;
}

// eslint-disable-next-line complexity
export function ActiveAccount({
  logoStyle,
  containerStyle,
  isLargeRounded = true,
  className = '',
  onClick = () => {
    // do nothing
  },
}: ActiveAccountProps) {
  const {
    network,
    connection: { status, accounts },
  } = useApi();
  const containerCls = useMemo(
    () =>
      `flex items-center justify-between leading-normal whitespace-nowrap bg-pangolin 
        ${isLargeRounded ? 'rounded-xl ' : 'rounded-lg '}
        ${className}`,
    [isLargeRounded, className]
  );
  const walletLogo = useMemo(() => {
    const metamask = 'image/metamask-fox.svg';
    const polkadot = 'image/polkadot.svg';

    if (isEthereumNetwork(network?.name)) {
      return 'image/metamask-fox.svg';
    }

    if (isPolkadotNetwork(network?.name)) {
      return getNetworkMode(network!) === 'dvm' ? metamask : polkadot;
    }

    if (isTronNetwork(network?.name)) {
      return 'image/tron.png';
    }

    return '';
  }, [network]);

  if (status !== 'success' || !accounts?.length || !network) {
    return null;
  }

  return (
    <div className={containerCls} onClick={onClick} style={containerStyle || {}}>
      <img
        src={network.facade.logoMinor}
        style={logoStyle || { height: 32 }}
        className="hidden sm:inline-block"
        alt=""
      />
      <span className="text-white mr-2 ml-1 hidden sm:inline">{getDisplayName(network)}</span>
      {isPolkadotNetwork(network.name) && getNetworkMode(network) === 'native' ? null : (
        <div className="self-stretch flex items-center justify-between sm:px-1 bg-white dark:bg-gray-800 sm:my-px sm:mx-px rounded-lg sm:rounded-xl text-gray-800 dark:text-gray-200 w-36 sm:w-48 md:w-56 ">
          <img src={walletLogo} style={{ height: 18 }} className="mx-2" />
          <EllipsisMiddle>{accounts[0].address}</EllipsisMiddle>
        </div>
      )}
    </div>
  );
}
