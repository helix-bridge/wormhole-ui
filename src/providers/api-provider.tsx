import { ApiPromise } from '@polkadot/api';
import { createContext, Dispatch, useCallback, useEffect, useReducer, useState } from 'react';
import { EMPTY, from, Subscription, switchMap, switchMapTo } from 'rxjs';
import { Units } from 'web3-utils';
import { NETWORK_CONFIG } from '../config';
import { Action, ConnectStatus, IAccountMeta, MetamaskError, NetConfig, Network } from '../model';
import {
  getEthConnection,
  getInitialSetting,
  getPolkadotConnection,
  getUnit,
  isEthereumNetwork,
  isMetamaskInstalled,
  isNetworkConsistent,
  isPolkadotNetwork,
  switchMetamaskNetwork,
} from '../utils';
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
  connectToEth: (network: Network, id?: string | undefined) => Subscription;
  connectToSubstrate: (network: Network) => Subscription;
  disconnect: () => void;
  dispatch: Dispatch<Action<ActionType>>;
  setAccounts: (accounts: IAccountMeta[]) => void;
  setNetworkStatus: (status: ConnectStatus) => void;
  switchNetwork: (type: Network | null) => void;
  setEnableTestNetworks: (enable: boolean) => void;
  setApi: (api: ApiPromise) => void;
  networkConfig: NetConfig | null;
  chain: Chain;
};

export const ApiContext = createContext<ApiCtx | null>(null);

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const connectToEth = useCallback(
    (network: Network, chainId?: string) => {
      if (!isMetamaskInstalled() || network === null) {
        return EMPTY.subscribe();
      }

      return from(isNetworkConsistent(network, chainId))
        .pipe(
          switchMap((isMatch) => {
            if (isMatch) {
              return getEthConnection(network);
            } else {
              return switchMetamaskNetwork(network).pipe(switchMapTo(getEthConnection(network)));
            }
          })
        )
        .subscribe({
          next: ({ status, accounts }) => {
            setAccounts(accounts);
            setNetworkStatus(status);
          },
          error: (err: MetamaskError) => {
            console.error('%c [ Ethereum connection error ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
            setAccounts([]);
            setNetworkStatus('error');
          },
          complete: () => {
            console.info('Ethereum connection complete, cancel connection to ', network);
          },
        });
    },
    [setAccounts, setNetworkStatus]
  );

  const connectToSubstrate = useCallback(
    (network: Network) => {
      if (!network) {
        return EMPTY.subscribe();
      }

      return getPolkadotConnection(network).subscribe({
        next: ({ status, accounts, api: nApi }) => {
          setAccounts(accounts);
          setApi(nApi);
          setNetworkStatus(status);
        },
        error: (_) => {
          setAccounts([]);
          setNetworkStatus('error');
        },
        complete: () => {
          console.info('Substrate connection complete, cancel connection to ', network);
        },
      });
    },
    [setAccounts, setNetworkStatus]
  );

  // eslint-disable-next-line complexity
  const disconnect = useCallback(() => {
    const isPolkadot = isPolkadotNetwork(state.network);

    if (isPolkadot && api && api.isConnected) {
      if (subscription) {
        subscription.unsubscribe();
      }

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
  }, [api, setAccounts, setNetworkStatus, state.network, subscription]);

  /**
   * connect to substrate or metamask when network changed.
   */
  useEffect(() => {
    let sub$$: Subscription = EMPTY.subscribe();

    if (state.network === null) {
      setNetworkStatus('pending');
    } else {
      if (isPolkadotNetwork(state.network)) {
        sub$$ = connectToSubstrate(state.network);
      }

      if (isEthereumNetwork(state.network)) {
        sub$$ = connectToEth(state.network);
      }
    }

    setSubscription(sub$$);

    return () => {
      console.info('[Api provider] Cancel network subscription of network', state.network);
      sub$$.unsubscribe();
    };
  }, [connectToEth, connectToSubstrate, setNetworkStatus, state.network]);

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
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};
