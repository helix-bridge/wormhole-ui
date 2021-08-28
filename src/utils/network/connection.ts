import { typesBundle } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import {
  catchError,
  concatMap,
  EMPTY,
  from,
  map,
  mapTo,
  merge,
  Observable,
  Observer,
  of,
  startWith,
  switchMap,
  switchMapTo,
} from 'rxjs';
import { NETWORK_CONFIG, SHORT_DURATION } from '../../config';
import { Connection, EthereumConnection, Network, NetworkCategory, PolkadotConnection } from '../../model';
import { getNetworkCategory, isMetamaskInstalled, isNetworkConsistent } from './network';
import { switchMetamaskNetwork } from './switch';

type ConnectionFn<T extends Connection> = (network: Network) => Observable<T>;

type ConnectFn<T extends Connection> = (network: Network, chainId?: string) => Observable<T>;

type ConnectConfig = {
  [key in NetworkCategory]: ConnectFn<Connection>;
};

export const getPolkadotConnection: ConnectionFn<PolkadotConnection> = (network) =>
  from(web3Enable('polkadot-js/apps')).pipe(
    concatMap((extensions) => from(web3Accounts()).pipe(map((accounts) => ({ accounts, extensions })))),
    switchMap(({ accounts, extensions }) => {
      let counter = 1;
      let reconnecting = false;

      return new Observable((observer: Observer<PolkadotConnection>) => {
        const url = NETWORK_CONFIG[network].provider.rpc;
        const provider = new WsProvider(url);
        const api = new ApiPromise({
          provider,
          typesBundle,
        });
        const envelop: PolkadotConnection = {
          status: 'success',
          accounts: !extensions.length && !accounts.length ? [] : accounts,
          api,
        };

        const reconnect = () => {
          // eslint-disable-next-line no-magic-numbers
          console.info(`Reconnect after ${(counter * SHORT_DURATION) / 1000} seconds`);

          setTimeout(() => {
            try {
              if (!api.isConnected && !reconnecting) {
                console.info(`Reconnect Start: Attempting to reconnect for the ${counter}th times`);
                counter += 1;
                reconnecting = true;
                observer.next({ ...envelop, status: 'connecting' });
                api.connect().finally(() => {
                  reconnecting = false;
                });
              } else {
                console.info(`Reconnect launch failed, because of the ${counter}th reconnection still in process`);
              }
            } catch (error: unknown) {
              console.warn(`Reconnect Error: The ${counter - 1}th reconnecting failed`, error);
            }
          }, SHORT_DURATION * counter);
        };

        api.on('ready', () => {
          observer.next(envelop);
        });

        api.on('connected', () => {
          api.isReady.then(() => {
            observer.next(envelop);
          });
        });

        api.on('disconnected', () => {
          observer.next({ ...envelop, status: 'disconnected' });
          reconnect();
        });

        api.on('error', (_) => {
          observer.next({ ...envelop, status: 'error' });
          reconnect();
        });
      });
    }),
    startWith<PolkadotConnection>({ status: 'connecting', accounts: [], api: null })
  );

export const getEthConnection: ConnectionFn<EthereumConnection> = (network) => {
  return from(window.ethereum.request({ method: 'eth_requestAccounts' })).pipe(
    switchMap((_) => {
      const addressToAccounts = (addresses: string[]) =>
        addresses.map((address) => ({ address, meta: { source: '' } }));

      const request: Observable<EthereumConnection> = from<string[][]>(
        window.ethereum.request({ method: 'eth_accounts' })
      ).pipe(map((addresses) => ({ accounts: addressToAccounts(addresses), status: 'success' })));

      const obs = new Observable((observer: Observer<EthereumConnection>) => {
        window.ethereum.on('accountsChanged', (accounts: string[]) =>
          observer.next({
            status: 'success',
            accounts: addressToAccounts(accounts),
          })
        );
        window.ethereum.on('chainChanged', (chainId: string) => {
          from(isNetworkConsistent(network, chainId))
            .pipe(
              switchMap((isMatch) => (isMatch ? request : of<EthereumConnection>({ status: 'error', accounts: [] })))
            )
            .subscribe((state) => observer.next(state));
        });
        window.ethereum.on('disconnect', () => {
          observer.next({ status: 'disconnected', accounts: [] });
          observer.complete();
        });
      });

      return merge(request, obs);
    }),
    catchError((_, caught) => {
      return caught.pipe(mapTo<EthereumConnection>({ status: 'error', accounts: [] }));
    }),
    startWith<EthereumConnection>({ status: 'connecting', accounts: [] })
  );
};

const connectToPolkadot: ConnectFn<PolkadotConnection> = (network: Network) => {
  if (!network) {
    return EMPTY;
  }

  return getPolkadotConnection(network);
};

const connectToEth: ConnectFn<EthereumConnection> = (network: Network, chainId?: string) => {
  if (!isMetamaskInstalled() || network === null) {
    return EMPTY;
  }

  return from(isNetworkConsistent(network, chainId)).pipe(
    switchMap((isMatch) =>
      isMatch ? getEthConnection(network) : switchMetamaskNetwork(network).pipe(switchMapTo(getEthConnection(network)))
    )
  );
};

const config: ConnectConfig = {
  polkadot: connectToPolkadot,
  ethereum: connectToEth,
  darwinia: connectToPolkadot,
};

export const connect: ConnectFn<Connection> = (network, chainId) => {
  const category = getNetworkCategory(network);

  if (category === null) {
    return EMPTY;
  }

  return config[category](network, chainId);
};
