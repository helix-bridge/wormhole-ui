import { typesBundle } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { Button, message, notification } from 'antd';
import { createContext, Dispatch, useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Units } from 'web3-utils';
import { NETWORK_CONFIG } from '../config';
import { Action, ConnectStatus, IAccountMeta, NetConfig, Network } from '../model';
import {
  addEthereumChain,
  getInitialSetting,
  isEthereumNetwork,
  isNativeMetamaskChain,
  isNetworkConsistent,
  isPolkadotNetwork,
  switchEthereumChain,
} from '../utils';

interface StoreState {
  accounts: IAccountMeta[] | null;
  network: Network | null;
  networkStatus: ConnectStatus;
  isDev: boolean;
  enableTestNetworks: boolean;
}

export interface TokenChainInfo {
  symbol: string;
  decimal: keyof Units;
}

export interface Chain {
  tokens: TokenChainInfo[];
  ss58Format: string;
}

type ActionType = 'switchNetwork' | 'updateNetworkStatus' | 'setAccounts' | 'setEnableTestNetworks';

const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

export function isMetamaskInstalled(): boolean {
  return typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined';
}

const initialState: StoreState = {
  network: getInitialSetting<Network>('from', null),
  accounts: null,
  networkStatus: 'pending',
  isDev,
  enableTestNetworks: isDev,
};

// eslint-disable-next-line complexity, @typescript-eslint/no-explicit-any
function accountReducer(state: StoreState, action: Action<ActionType, any>): StoreState {
  switch (action.type) {
    case 'switchNetwork': {
      return { ...state, network: action.payload as Network };
    }

    case 'setAccounts': {
      return { ...state, accounts: action.payload };
    }

    case 'updateNetworkStatus': {
      return { ...state, networkStatus: action.payload };
    }

    case 'setEnableTestNetworks': {
      return { ...state, enableTestNetworks: action.payload };
    }

    default:
      return state;
  }
}

export type ApiCtx = StoreState & {
  api: ApiPromise | null;
  connectToEth: (id?: string | undefined) => Promise<void>;
  connectToSubstrate: () => Promise<(() => void) | void>;
  disconnect: () => void;
  dispatch: Dispatch<Action<ActionType>>;
  setAccounts: (accounts: IAccountMeta[]) => void;
  setNetworkStatus: (status: ConnectStatus) => void;
  switchNetwork: (type: Network | null) => void;
  setEnableTestNetworks: (enable: boolean) => void;
  setApi: (api: ApiPromise) => void;
  networkConfig: NetConfig | null;
  chain: Chain;
  extensions: InjectedExtension[] | undefined;
};

export const ApiContext = createContext<ApiCtx | null>(null);

export const ApiProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(accountReducer, initialState);
  const switchNetwork = useCallback((payload: Network | null) => dispatch({ type: 'switchNetwork', payload }), []);
  const setAccounts = useCallback((payload: IAccountMeta[]) => dispatch({ type: 'setAccounts', payload }), []);
  const setEnableTestNetworks = useCallback(
    (payload: boolean) => dispatch({ type: 'setEnableTestNetworks', payload }),
    []
  );
  const setNetworkStatus = useCallback(
    (payload: ConnectStatus) => dispatch({ type: 'updateNetworkStatus', payload }),
    []
  );
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [chain, setChain] = useState<Chain>({ ss58Format: '', tokens: [] });
  const [extensions, setExtensions] = useState<InjectedExtension[] | undefined>(undefined);
  const notify = useCallback(
    (network: Network) => {
      const key = `key${Date.now()}`;
      const promise = new Promise((resolve, reject) => {
        const fail = (err: Record<string, unknown>) => {
          message.error(t('Network switch failed, please switch it in the metamask plugin'));
          setNetworkStatus('fail');
          reject(err);
        };
        notification.error({
          message: t('Incorrect network'),
          description: t(
            'Network mismatch, you can switch network manually in metamask or do it automatically by clicking the button below',
            { type: network }
          ),
          btn: (
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const isNative = isNativeMetamaskChain(network);
                  const action = isNative ? switchEthereumChain : addEthereumChain;
                  const res = await action(network);

                  if (res === null) {
                    notification.close(key);
                    resolve(res as null);
                  } else {
                    fail(res);
                  }
                } catch (err) {
                  fail(err);
                }
              }}
            >
              {t('Switch to {{network}}', { network })}
            </Button>
          ),
          key,
          onClose: () => notification.close(key),
          duration: null,
        });
      });

      return promise;
    },
    [setNetworkStatus, t]
  );
  const metamaskAccountChanged = useCallback(
    (accounts: string[]) => {
      setAccounts(accounts.map((address) => ({ address, meta: { source: '' } })));
    },
    [setAccounts]
  );
  const connectToEth = useCallback(
    async (chainId?: string) => {
      if (!isMetamaskInstalled() || !state.network) {
        return;
      }

      setNetworkStatus('connecting');

      const isMatch = await isNetworkConsistent(state.network, chainId);
      const canRequest = isMatch || !(await notify(state.network));

      if (!canRequest) {
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });

      setAccounts(accounts.map((address) => ({ address })));
      setNetworkStatus('success');
      window.ethereum.removeListener('accountsChanged', metamaskAccountChanged);
      window.ethereum.on('accountsChanged', metamaskAccountChanged);
      window.ethereum.on('disconnect', () => {
        if (isEthereumNetwork(state.network)) {
          setNetworkStatus('disconnected');
        }
      });
    },
    [metamaskAccountChanged, notify, setAccounts, setNetworkStatus, state.network]
  );

  const connectToSubstrate = useCallback(async () => {
    if (!state.network) {
      return;
    }

    setNetworkStatus('connecting');

    const url = NETWORK_CONFIG[state.network].rpc;
    const provider = new WsProvider(url);
    const nApi = new ApiPromise({
      provider,
      typesBundle,
    });

    const onReady = async () => {
      const exts = await web3Enable('polkadot-js/apps');
      const newAccounts = await web3Accounts();

      setExtensions(exts);
      setApi(nApi);
      setAccounts(!exts.length && !newAccounts.length ? [] : newAccounts);
      setNetworkStatus('success');
    };
    const onDisconnected = () => {
      if (isPolkadotNetwork(state.network)) {
        setNetworkStatus('disconnected');
      }
    };

    nApi.on('ready', onReady);
    nApi.on('disconnected', onDisconnected);

    return () => {
      nApi.off('ready', onReady);
      nApi.off('disconnected', onDisconnected);
    };
  }, [setAccounts, setNetworkStatus, state.network]);

  // eslint-disable-next-line complexity
  const disconnect = useCallback(() => {
    const isPolkadot = isPolkadotNetwork(state.network);

    if (isPolkadot && api && api.isConnected) {
      api.disconnect().then(() => {
        setNetworkStatus('pending');
        setApi(null);
      });
      return;
    }

    const isEthereum = isEthereumNetwork(state.network);

    if (isEthereum && window.ethereum.isConnected()) {
      setNetworkStatus('pending');
      setAccounts([]);
      return;
    }
  }, [api, setAccounts, setNetworkStatus, state.network]);

  /**
   * connect to substrate or metamask when account type changed.
   */
  useEffect(() => {
    (async () => {
      try {
        if (!state.network) {
          setNetworkStatus('pending');
          return;
        }

        if (isPolkadotNetwork(state.network)) {
          connectToSubstrate();
        }

        if (isEthereumNetwork(state.network)) {
          connectToEth();

          window.ethereum.on('chainChanged', connectToEth);
        }
      } catch (error) {
        setNetworkStatus('fail');
      }
    })();

    return () => {
      window.ethereum.removeListener('chainChanged', connectToEth);
    };
  }, [connectToEth, connectToSubstrate, setNetworkStatus, state.network]);

  useEffect(() => {
    if (!api) {
      return;
    }

    (async () => {
      const chainState = await api?.rpc.system.properties();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tokenDecimals, tokenSymbol, ss58Format } = chainState?.toHuman() as any;
      const chainInfo = tokenDecimals.reduce(
        (acc: Chain, decimal: string, index: number) => {
          const token = { decimal, symbol: tokenSymbol[index] };

          return { ...acc, tokens: [...acc.tokens, token] };
        },
        { ss58Format, tokens: [] } as Chain
      );

      setChain(chainInfo);
    })();
  }, [api]);

  return (
    <ApiContext.Provider
      value={{
        ...state,
        disconnect,
        dispatch,
        switchNetwork,
        setNetworkStatus,
        setAccounts,
        setEnableTestNetworks,
        setApi,
        connectToEth,
        connectToSubstrate,
        api,
        networkConfig: state.network ? NETWORK_CONFIG[state.network] : null,
        chain,
        extensions,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};
