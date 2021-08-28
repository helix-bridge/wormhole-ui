import { ApiPromise } from '@polkadot/api';
import { createContext, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { EMPTY, Subscription } from 'rxjs';
import { Units } from 'web3-utils';
import { NETWORK_CONFIG } from '../config';
import { Action, Connection, ConnectStatus, IAccountMeta, NetConfig, Network, PolkadotConnection } from '../model';
import { connect, getInitialSetting, getUnit, isEthereumNetwork, isPolkadotNetwork } from '../utils';
import { updateStorage } from '../utils/helper/storage';

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

const initialState: StoreState = {
  network: getInitialSetting<Network>('from', null),
  accounts: null,
  networkStatus: 'pending',
  isDev,
  enableTestNetworks: !!getInitialSetting('enableTestNetworks', isDev),
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
  connectNetwork: (network: Network) => void;
  disconnect: () => void;
  setNetworkStatus: (status: ConnectStatus) => void;
  switchNetwork: (type: Network | null) => void;
  setEnableTestNetworks: (enable: boolean) => void;
  setApi: (api: ApiPromise) => void;
  networkConfig: NetConfig | null;
  chain: Chain;
};

export const ApiContext = createContext<ApiCtx | null>(null);

let subscription: Subscription = EMPTY.subscribe();

export const ApiProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [state, dispatch] = useReducer(accountReducer, initialState);
  const switchNetwork = useCallback((payload: Network | null) => dispatch({ type: 'switchNetwork', payload }), []);
  const setAccounts = useCallback((payload: IAccountMeta[]) => dispatch({ type: 'setAccounts', payload }), []);
  const setEnableTestNetworks = useCallback((payload: boolean) => {
    dispatch({ type: 'setEnableTestNetworks', payload });
    updateStorage({ enableTestNetworks: payload });
  }, []);
  const setNetworkStatus = useCallback(
    (payload: ConnectStatus) => dispatch({ type: 'updateNetworkStatus', payload }),
    []
  );
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [chain, setChain] = useState<Chain>({ ss58Format: '', tokens: [] });
  const observer = useMemo(
    () => ({
      next: (connection: Connection) => {
        const { status, accounts } = connection;
        setAccounts(accounts);
        setNetworkStatus(status);
        if ((connection as PolkadotConnection).api) {
          setApi((connection as PolkadotConnection).api);
        }
      },
      error: (err: unknown) => {
        setAccounts([]);
        setNetworkStatus('error');
        console.error('%c connection error ', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      },
      complete: () => {
        console.info('Connection life is over');
      },
    }),
    [setAccounts, setNetworkStatus]
  );
  const connectNetwork = useCallback(
    (network: Network) => {
      subscription.unsubscribe();

      subscription = connect(network).subscribe(observer);
    },
    [observer]
  );

  // eslint-disable-next-line complexity
  const disconnect = useCallback(() => {
    const isPolkadot = isPolkadotNetwork(state.network);

    if (isPolkadot && api && api.isConnected) {
      subscription.unsubscribe();
      api.disconnect().then(() => {
        setNetworkStatus('pending');
        setAccounts([]);
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

  useEffect(() => {
    if (state.network === null) {
      setNetworkStatus('pending');
    } else {
      subscription = connect(state.network).subscribe(observer);
    }

    return () => {
      console.info('[Api provider] Cancel network subscription of network', state.network);
      subscription.unsubscribe();
    };
  }, [observer, setNetworkStatus, state.network]);

  useEffect(() => {
    if (!api) {
      return;
    }

    (async () => {
      if (!api.isConnected) {
        await api.connect();
      }

      const chainState = await api?.rpc.system.properties();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tokenDecimals, tokenSymbol, ss58Format } = chainState?.toHuman() as any;
      const chainInfo = tokenDecimals.reduce(
        (acc: Chain, decimal: string, index: number) => {
          const unit = getUnit(+decimal);
          const token = { decimal: unit, symbol: tokenSymbol[index] };

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
        connectNetwork,
        disconnect,
        switchNetwork,
        setNetworkStatus,
        setEnableTestNetworks,
        setApi,
        api,
        networkConfig: state.network ? NETWORK_CONFIG[state.network] : null,
        chain,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};
