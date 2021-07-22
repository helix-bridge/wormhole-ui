import BN from 'bn.js';
import { createContext, useCallback, useEffect, useState } from 'react';
import { useAccount, useApi } from '../hooks';
// import { getTokenBalanceDarwinia, getTokenBalanceEth, isNetworkConsistent } from '../utils';

export interface AssetsState {
  native: BN;
  [key: string]: BN;
}

export interface AssetsCtx {
  assets: AssetsState | null;
  reloadAssets: () => void;
}

export const AssetsContext = createContext<AssetsCtx | null>(null);

export const AssetsProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const { account } = useAccount();
  const { api, network, networkConfig } = useApi();
  const [assets, setAssets] = useState<AssetsState | null>(null);
  const reloadAssets = useCallback(
    // eslint-disable-next-line complexity
    async (chainId?: string) => {
      console.info('🚀 ~ file: assets-provider.tsx ~ line 26 ~ chainId', chainId, account, api, network, networkConfig);
      // if (account) {
      //   [ring, kton] = await getTokenBalanceDarwinia(api, account);
      // }

      // if (account) {
      //   const isConsistent = await isNetworkConsistent(network, chainId);

      //   // we have show notification in api provider.
      //   if (isConsistent) {
      //     [ring, kton] = await getTokenBalanceEth(networkConfig.erc20.kton, account);
      //   }
      // }

      setAssets(null);
    },
    [account, api, network, networkConfig]
  );

  useEffect(() => {
    reloadAssets().then(() => {
      // do nothing;
    });

    if (window.ethereum) {
      window.ethereum.on('chainChanged', reloadAssets);
    }

    return () => {
      window.ethereum.removeListener('chainChanged', reloadAssets);
    };
  }, [reloadAssets]);

  return (
    <AssetsContext.Provider
      value={{
        reloadAssets,
        assets,
      }}
    >
      {children}
    </AssetsContext.Provider>
  );
};
