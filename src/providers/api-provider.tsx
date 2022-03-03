import { ApiPromise } from '@polkadot/api';
import { negate } from 'lodash';
import { createContext, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { EMPTY, iif, of, Subscription } from 'rxjs';
import Web3 from 'web3';
import {
  Action,
  ChainConfig,
  Connection,
  ConnectionStatus,
  EthereumChainConfig,
  EthereumConnection,
  Network,
  NetworkMode,
  NoNullFields,
  PolkadotChain,
  PolkadotConnection,
  TronConnection,
} from '../model';
import {
  connect,
  getInitialSetting,
  getUnit,
  isDVM,
  isEthereumNetwork,
  isPolkadotNetwork,
  verticesToChainConfig,
  waitUntilConnected,
} from '../utils';
import { updateStorage } from '../utils/helper/storage';

interface StoreState {
  mainConnection: Connection;
  connections: (NoNullFields<PolkadotConnection> | EthereumConnection | TronConnection)[];
  network: ChainConfig | null;
  isDev: boolean;
  enableTestNetworks: boolean;
}

type SetNetworkAction = Action<'setNetwork', ChainConfig | null>;
type SetMainConnection = Action<'setMainConnection', Connection>;
type SetEnableTestNetworks = Action<'setEnableTestNetworks', boolean>;
type AddConnection = Action<'addConnection', Connection>;
type RemoveConnection = Action<'removeConnection', Connection>;

type Actions = SetNetworkAction | SetMainConnection | SetEnableTestNetworks | AddConnection | RemoveConnection;

const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

const initialNetworkConfig = () => {
  const network = getInitialSetting<Network>('from', null);
  const mode = getInitialSetting<NetworkMode>('fMode', 'native') ?? 'native';

  return network && verticesToChainConfig({ network, mode });
};

const initialConnection: Connection = {
  status: ConnectionStatus.pending,
  type: 'unknown',
  accounts: [],
  chainId: '',
  network: null,
};

const initialState: StoreState = {
  mainConnection: initialConnection,
  connections: [],
  network: initialNetworkConfig(),
  isDev,
  enableTestNetworks: !!getInitialSetting('enableTestNetworks', isDev),
};

const isConnectionOfChain = (chain: ChainConfig) => {
  const isConnectToMetamask = isDVM(chain) || isEthereumNetwork(chain.name);

  return (target: Connection | NoNullFields<PolkadotConnection> | EthereumConnection) => {
    const { network, chainId } = target;

    return isConnectToMetamask
      ? chainId === Web3.utils.toHex((chain as EthereumChainConfig).ethereumChain.chainId)
      : network === chain.name;
  };
};

const isSameConnection = (origin: Connection) => {
  return (item: Connection) => {
    return (
      item.type === origin.type &&
      ((item.network === (origin as PolkadotConnection).network && !!item.network) ||
        (item.chainId === (origin as EthereumConnection).chainId && !!item.chainId))
    );
  };
};

// eslint-disable-next-line complexity
function reducer(state: StoreState, action: Actions): StoreState {
  switch (action.type) {
    case 'setNetwork': {
      return { ...state, network: action.payload };
    }

    case 'setMainConnection': {
      return { ...state, mainConnection: action.payload };
    }

    case 'setEnableTestNetworks': {
      return { ...state, enableTestNetworks: action.payload };
    }

    case 'addConnection': {
      return {
        ...state,
        connections: state.connections.filter(negate(isSameConnection(action.payload))).concat([action.payload]),
      };
    }

    case 'removeConnection': {
      return {
        ...state,
        connections: state.connections.filter(negate(isSameConnection(action.payload))),
      };
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
  chain: PolkadotChain;
};

export const ApiContext = createContext<ApiCtx | null>(null);

let subscription: Subscription = EMPTY.subscribe();

export const ApiProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const setNetwork = useCallback((payload: ChainConfig | null) => dispatch({ type: 'setNetwork', payload }), []);
  const setMainConnection = useCallback((payload: Connection) => dispatch({ type: 'setMainConnection', payload }), []);
  const removeConnection = useCallback((payload: Connection) => dispatch({ type: 'removeConnection', payload }), []);
  const addConnection = useCallback((payload: Connection) => dispatch({ type: 'addConnection', payload }), []);

  const setEnableTestNetworks = useCallback((payload: boolean) => {
    dispatch({ type: 'setEnableTestNetworks', payload });
    updateStorage({ enableTestNetworks: payload });
  }, []);

  const [api, setApi] = useState<ApiPromise | null>(null);
  const [chain, setChain] = useState<PolkadotChain>({ ss58Format: '', tokens: [] });

  const observer = useMemo(
    () => ({
      next: (connection: Connection) => {
        setMainConnection(connection);

        const nApi = (connection as PolkadotConnection).api;

        if (nApi && connection.status === ConnectionStatus.success) {
          setApi(nApi);
          addConnection(connection);
        } else if (connection.status === ConnectionStatus.success) {
          addConnection(connection);
        }
      },
      error: (err: unknown) => {
        setMainConnection({ ...initialConnection, status: ConnectionStatus.error });
        console.error('%c connection error ', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      },
      complete: () => {
        console.info('Connection life is over');
      },
    }),
    [addConnection, setMainConnection]
  );

  const connectNetwork = useCallback(
    (chainConfig: ChainConfig) => {
      const connection = state.connections.find(isConnectionOfChain(chainConfig));

      subscription.unsubscribe();

      setNetwork(chainConfig);

      subscription = iif(
        () => {
          const existAvailableConnection = !!connection && connection.status === ConnectionStatus.success;

          // !FIXME: better to wait for reconnecting?
          if (connection && connection.status !== ConnectionStatus.success) {
            removeConnection(connection);
          }

          return existAvailableConnection;
        },
        of(connection!),
        connect(chainConfig)
      ).subscribe(observer);
    },
    [observer, removeConnection, setNetwork, state.connections]
  );

  // eslint-disable-next-line complexity
  const disconnect = useCallback(() => {
    const isDvm = state.network && isDVM(state.network);
    const isPolkadot = isPolkadotNetwork(state.network?.name) && !isDvm;

    // !FIXME
    if (isPolkadot && api && api.isConnected) {
      subscription.unsubscribe();

      setMainConnection(initialConnection);
      setApi(null);
      setNetwork(null);

      return;
    }

    const isEthereum = isEthereumNetwork(state.network?.name) || isDvm;

    if ((isEthereum && window.ethereum.isConnected()) || state.network?.name === 'tron') {
      setMainConnection(initialConnection);
      setNetwork(null);
      return;
    }
  }, [api, setMainConnection, setNetwork, state.network]);

  useEffect(() => {
    if (!state.network) {
      setMainConnection(initialConnection);
    } else {
      subscription = connect(state.network).subscribe(observer);
    }

    return () => {
      console.info('[Api provider] Cancel network subscription of network', state.network?.name);
      subscription.unsubscribe();
    };
  }, [observer, setMainConnection, state.network]);

  useEffect(() => {
    if (!api) {
      setChain({ ss58Format: '', tokens: [] });
      return;
    }

    (async () => {
      await waitUntilConnected(api);

      const chainState = await api?.rpc.system.properties();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { tokenDecimals, tokenSymbol, ss58Format } = chainState?.toHuman() as any;
      const chainInfo = tokenDecimals.reduce(
        (acc: PolkadotChain, decimal: string, index: number) => {
          const unit = getUnit(+decimal);
          const token = { decimal: unit, symbol: tokenSymbol[index] };

          return { ...acc, tokens: [...acc.tokens, token] };
        },
        { ss58Format, tokens: [] } as PolkadotChain
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
