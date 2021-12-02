import { ApiPromise } from '@polkadot/api';
import { createContext, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { EMPTY, Subscription } from 'rxjs';
import {
  Action,
  Chain,
  ChainConfig,
  Connection,
  ConnectionStatus,
  Network,
  NetworkMode,
  PolkadotConnection,
} from '../model';
import {
  connect,
  getInitialSetting,
  getUnit,
  isDVM,
  isEthereumNetwork,
  isPolkadotNetwork,
  verticesToNetConfig,
  waitUntilConnected,
} from '../utils';
import { updateStorage } from '../utils/helper/storage';

interface StoreState {
  connection: Connection;
  network: ChainConfig | null;
  isDev: boolean;
  enableTestNetworks: boolean;
}

type ActionType = 'setNetwork' | 'setConnection' | 'setEnableTestNetworks';

const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

const initialNetworkConfig = () => {
  const network = getInitialSetting<Network>('from', null);
  const mode = getInitialSetting<NetworkMode>('fMode', 'native') ?? 'native';

  return network && verticesToNetConfig({ network, mode });
};

const initialConnection: Connection = {
  status: ConnectionStatus.pending,
  type: 'unknown',
  accounts: [],
  chainId: '',
};

const initialState: StoreState = {
  connection: initialConnection,
  network: initialNetworkConfig(),
  isDev,
  enableTestNetworks: !!getInitialSetting('enableTestNetworks', isDev),
};

// eslint-disable-next-line complexity, @typescript-eslint/no-explicit-any
function accountReducer(state: StoreState, action: Action<ActionType, any>): StoreState {
  switch (action.type) {
    case 'setNetwork': {
      return { ...state, network: action.payload };
    }

    case 'setConnection': {
      return { ...state, connection: action.payload };
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
  connectNetwork: (network: ChainConfig) => void;
  disconnect: () => void;
  setNetwork: (network: ChainConfig | null) => void;
  setEnableTestNetworks: (enable: boolean) => void;
  setApi: (api: ApiPromise) => void;
  chain: Chain;
};

export const ApiContext = createContext<ApiCtx | null>(null);

let subscription: Subscription = EMPTY.subscribe();

export const ApiProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [state, dispatch] = useReducer(accountReducer, initialState);
  const setNetwork = useCallback((payload: ChainConfig | null) => dispatch({ type: 'setNetwork', payload }), []);
  const setConnection = useCallback((payload: Connection) => dispatch({ type: 'setConnection', payload }), []);
  const setEnableTestNetworks = useCallback((payload: boolean) => {
    dispatch({ type: 'setEnableTestNetworks', payload });
    updateStorage({ enableTestNetworks: payload });
  }, []);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [chain, setChain] = useState<Chain>({ ss58Format: '', tokens: [] });
  const observer = useMemo(
    () => ({
      next: (connection: Connection) => {
        setConnection(connection);

        const nApi = (connection as PolkadotConnection).api;

        if (nApi) {
          nApi?.isReady.then(() => {
            setApi(nApi);
          });
        }
      },
      error: (err: unknown) => {
        setConnection({ status: ConnectionStatus.error, accounts: [], type: 'unknown', api: null });
        console.error('%c connection error ', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      },
      complete: () => {
        console.info('Connection life is over');
      },
    }),
    [setConnection]
  );
  const connectNetwork = useCallback(
    (config: ChainConfig) => {
      subscription.unsubscribe();

      setNetwork(config);
      subscription = connect(config).subscribe(observer);
    },
    [observer, setNetwork]
  );

  // eslint-disable-next-line complexity
  const disconnect = useCallback(() => {
    const isDvm = state.network && isDVM(state.network);
    const isPolkadot = isPolkadotNetwork(state.network?.name) && !isDvm;

    if (isPolkadot && api && api.isConnected) {
      subscription.unsubscribe();

      setConnection(initialConnection);
      setApi(null);
      setNetwork(null);

      return;
    }

    const isEthereum = isEthereumNetwork(state.network?.name) || isDvm;

    if ((isEthereum && window.ethereum.isConnected()) || state.network?.name === 'tron') {
      setConnection(initialConnection);
      setNetwork(null);
      return;
    }
  }, [api, setConnection, setNetwork, state.network]);

  useEffect(() => {
    if (!state.network) {
      setConnection(initialConnection);
    } else {
      subscription = connect(state.network).subscribe(observer);
    }

    return () => {
      console.info('[Api provider] Cancel network subscription of network', state.network?.name);
      subscription.unsubscribe();
    };
  }, [observer, setConnection, state.network]);

  useEffect(() => {
    if (!api) {
      return;
    }

    (async () => {
      await waitUntilConnected(api);

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
        setNetwork,
        setEnableTestNetworks,
        setApi,
        api,
        chain,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};
