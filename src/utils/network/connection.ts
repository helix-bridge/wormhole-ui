import { typesBundle } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import {
  catchError,
  combineLatest,
  concatMap,
  EMPTY,
  from,
  map,
  merge,
  Observable,
  Observer,
  of,
  startWith,
  switchMap,
  switchMapTo,
} from 'rxjs';
import { SHORT_DURATION } from '../../config';
import { Connection, EthereumConnection, NetConfig, NetworkCategory, PolkadotConnection } from '../../model';
import { getNetworkCategory, isMetamaskInstalled, isNetworkConsistent } from './network';
import { switchMetamaskNetwork } from './switch';

type ConnectFn<T extends Connection> = (network: NetConfig, chainId?: string) => Observable<T>;

type ConnectConfig = {
  [key in NetworkCategory]: ConnectFn<Connection>;
};

export const getPolkadotConnection: (network: NetConfig) => Observable<PolkadotConnection> = (network) =>
  from(web3Enable('polkadot-js/apps')).pipe(
    concatMap((extensions) => from(web3Accounts()).pipe(map((accounts) => ({ accounts, extensions })))),
    switchMap(({ accounts, extensions }) => {
      let counter = 1;
      let reconnecting = false;

      return new Observable((observer: Observer<PolkadotConnection>) => {
        const url = network.provider.rpc;
        const provider = new WsProvider(url);
        const api = new ApiPromise({
          provider,
          typesBundle,
        });
        const envelop: PolkadotConnection = {
          status: 'success',
          accounts: !extensions.length && !accounts.length ? [] : accounts,
          api,
          type: 'polkadot',
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
    startWith<PolkadotConnection>({ status: 'connecting', accounts: [], api: null, type: 'polkadot' })
  );

export const getEthConnection: () => Observable<EthereumConnection> = () => {
  return from(window.ethereum.request({ method: 'eth_requestAccounts' })).pipe(
    switchMap((_) => {
      const addressToAccounts = (addresses: string[]) =>
        addresses.map((address) => ({ address, meta: { source: '' } }));

      const request: Observable<EthereumConnection> = combineLatest([
        from<string[][]>(window.ethereum.request({ method: 'eth_accounts' })),
        from<string>(window.ethereum.request({ method: 'eth_chainId' })),
      ]).pipe(
        map(([addresses, chainId]) => ({
          accounts: addressToAccounts(addresses),
          status: 'success',
          chainId,
          type: 'metamask',
        }))
      );

      const obs = new Observable((observer: Observer<EthereumConnection>) => {
        window.ethereum.on('accountsChanged', (accounts: string[]) =>
          from<string>(window.ethereum.request({ method: 'eth_chainId' })).subscribe((chainId) => {
            observer.next({
              status: 'success',
              accounts: addressToAccounts(accounts),
              type: 'metamask',
              chainId,
            });
          })
        );
        window.ethereum.on('chainChanged', (chainId: string) => {
          from<string[][]>(window.ethereum.request({ method: 'eth_accounts' })).subscribe((accounts) => {
            observer.next({
              status: 'success',
              accounts: addressToAccounts(accounts),
              type: 'metamask',
              chainId,
            });
          });
        });
      });

      return merge(request, obs);
    }),
    catchError((_) => {
      return of<EthereumConnection>({ status: 'error', accounts: [], type: 'metamask', chainId: '' });
    }),
    startWith<EthereumConnection>({ status: 'connecting', accounts: [], type: 'metamask', chainId: '' })
  );
};

const connectToPolkadot: ConnectFn<PolkadotConnection> = (network) => {
  if (!network) {
    return EMPTY;
  }

  return getPolkadotConnection(network);
};

const connectToEth: ConnectFn<EthereumConnection> = (network, chainId?) => {
  if (!isMetamaskInstalled() || network === null) {
    return EMPTY;
  }

  return from(isNetworkConsistent(network.name, chainId)).pipe(
    switchMap((isMatch) =>
      isMatch ? getEthConnection() : switchMetamaskNetwork(network.name).pipe(switchMapTo(getEthConnection()))
    )
  );
};

const config: ConnectConfig = {
  darwinia: connectToPolkadot,
  dvm: connectToEth,
  ethereum: connectToEth,
  polkadot: connectToPolkadot,
  tron: connectToEth,
};

export const connect: ConnectFn<Connection> = (network, chainId) => {
  const category = getNetworkCategory(network);

  if (category === null) {
    return EMPTY;
  }

  return config[category](network, chainId);
};
