import { typesBundle } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { Button, notification } from 'antd';
import { createContext, Dispatch, useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NETWORK_CONFIG } from '../config';
import { Action, ConnectStatus, IAccountMeta, NetConfig, Network } from '../model';
import {
  addEthereumChain,
  getInitialSetting,
  isEthereumNetwork,
  isNetworkConsistent,
  isPolkadotNetwork,
} from '../utils';

interface StoreState {
  accounts: IAccountMeta[] | null;
  network: Network | null;
  networkStatus: ConnectStatus;
  isDev: boolean;
  enableTestNetworks: boolean;
}

interface Token {
  symbol: string;
  decimal: string;
}

export interface Chain {
  tokens: Token[];
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
  dispatch: Dispatch<Action<ActionType>>;
  setAccounts: (accounts: IAccountMeta[]) => void;
  setNetworkStatus: (status: ConnectStatus) => void;
  switchNetwork: (type: Network) => void;
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
  const switchNetwork = useCallback((payload: Network) => dispatch({ type: 'switchNetwork', payload }), []);
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
  const notify = useCallback(() => {
    const key = `key${Date.now()}`;

    notification.error({
      message: t('Incorrect network'),
      description: t(
        'Network mismatch, you can switch network manually in metamask or do it automatically by clicking the button below',
        { type: state.network }
      ),
      btn: (
        <Button
          type="primary"
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            addEthereumChain(state.network!).then((res) => {
              if (res === null) {
                notification.close(key);
              }
            });
          }}
        >
          {t('Switch to {{network}}', { network: state.network })}
        </Button>
      ),
      key,
      onClose: () => notification.close(key),
      duration: null,
    });

    setNetworkStatus('fail');
  }, [setNetworkStatus, state.network, t]);
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

      if (!isMatch) {
        notify();

        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });

      setAccounts(accounts.map((address) => ({ address })));
      setNetworkStatus('success');
      window.ethereum.removeListener('accountsChanged', metamaskAccountChanged);
      window.ethereum.on('accountsChanged', metamaskAccountChanged);
    },
    [metamaskAccountChanged, notify, setAccounts, setNetworkStatus, state.network]
  );

  const connectToSubstrate = useCallback(async () => {
    const curChain = await api?.rpc.system.chain();
    const chainNetwork = curChain?.toHuman().toLowerCase() ?? '';

    if (!state.network || chainNetwork === state.network || chainNetwork.includes(state.network)) {
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

    nApi.on('ready', onReady);

    return () => {
      nApi.off('ready', onReady);
    };
  }, [api?.rpc.system, setAccounts, setNetworkStatus, state.network]);

  /**
   * connect to substrate or metamask when account type changed.
   */
  useEffect(() => {
    // eslint-disable-next-line complexity
    (async () => {
      try {
        if (!state.network) {
          return;
        }

        if (isPolkadotNetwork(state.network)) {
          connectToSubstrate();
        }

        if (isEthereumNetwork(state.network)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          // const { ethereumChain } = getNetworkByName(state.network)!;

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
    if (state.networkStatus === 'disconnected') {
      if (isEthereumNetwork(state.network)) {
        connectToEth();
      }

      if (isPolkadotNetwork(state.network)) {
        connectToSubstrate();
      }
    }
  }, [connectToEth, connectToSubstrate, state.network, state.networkStatus]);

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
        dispatch,
        switchNetwork,
        setNetworkStatus,
        setAccounts,
        setEnableTestNetworks,
        setApi,
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
