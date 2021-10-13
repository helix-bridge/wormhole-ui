import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { Modal } from 'antd';
import Link from 'antd/lib/typography/Link';
import { Trans } from 'react-i18next';
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
import {
  Connection,
  EthereumConnection,
  NetConfig,
  NetworkCategory,
  PolkadotConnection,
  TronConnection,
} from '../../model';
import { getNetworkCategory, isMetamaskInstalled, isNetworkConsistent, isTronLinkReady } from './network';
import { entrance } from './entrance';
import { switchMetamaskNetwork } from './switch';

type ConnectFn<T extends Connection> = (network: NetConfig, chainId?: string) => Observable<T>;

type ConnectConfig = {
  [key in NetworkCategory]: ConnectFn<Connection>;
};

interface TronAddress {
  base58: string;
  hex: string;
  name?: string;
}

export const getPolkadotConnection: (network: NetConfig) => Observable<PolkadotConnection> = (network) =>
  from(web3Enable('polkadot-js/apps')).pipe(
    concatMap((extensions) => from(web3Accounts()).pipe(map((accounts) => ({ accounts, extensions })))),
    switchMap(({ accounts, extensions }) => {
      let counter = 1;
      let reconnecting = false;

      return new Observable((observer: Observer<PolkadotConnection>) => {
        const url = network.provider.rpc;
        const api = entrance.polkadot.getInstance(url);
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

        if (api.isConnected) {
          observer.next(envelop);
        }

        api.on('connected', () => {
          observer.next(envelop);
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

export const getTronConnection: () => Observable<TronConnection> = () => {
  const wallet = window.tronWeb.defaultAddress;
  const mapData: (data: TronAddress) => TronConnection = (data) => ({
    status: 'success',
    accounts: [{ address: data.base58, meta: { name: data?.name ?? '', source: '', genesisHash: '' } }],
    type: 'tron',
  });
  const obs: Observable<TronConnection> = new Observable((observer) => {
    window.tronWeb.on('addressChanged', (data: TronAddress) => {
      observer.next(mapData(data));
    });
  });

  return obs.pipe(startWith<TronConnection>(mapData(wallet)));
};

const showWarning = (plugin: string, downloadUrl: string) =>
  Modal.warn({
    title: <Trans>Missing Wallet Plugin</Trans>,
    content: (
      <Trans i18nKey="MissingPlugin">
        We need {{ plugin }} plugin to continue. Please
        <Link href={downloadUrl} target="_blank">
          {' '}
          Install{' '}
        </Link>
        or unlock it first.
      </Trans>
    ),
    okText: <Trans>OK</Trans>,
  });

const connectToPolkadot: ConnectFn<PolkadotConnection> = (network) => {
  if (!network) {
    return EMPTY;
  }

  return getPolkadotConnection(network);
};

const connectToEth: ConnectFn<EthereumConnection> = (network, chainId?) => {
  if (!isMetamaskInstalled()) {
    showWarning(
      'metamask',
      'https://chrome.google.com/webstore/detail/empty-title/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=zh-CN'
    );
    return EMPTY;
  }

  return from(isNetworkConsistent(network.name, chainId)).pipe(
    switchMap((isMatch) =>
      isMatch ? getEthConnection() : switchMetamaskNetwork(network.name).pipe(switchMapTo(getEthConnection()))
    )
  );
};

const connectToTron = () => {
  return from(isTronLinkReady()).pipe(
    switchMap((isReady) => {
      if (!isReady) {
        showWarning(
          'tronLink',
          'https://chrome.google.com/webstore/detail/tronlink%EF%BC%88%E6%B3%A2%E5%AE%9D%E9%92%B1%E5%8C%85%EF%BC%89/ibnejdfjmmkpcnlpebklmnkoeoihofec'
        );
        return EMPTY;
      } else {
        return getTronConnection();
      }
    })
  );
};

const config: ConnectConfig = {
  darwinia: connectToPolkadot,
  dvm: connectToEth,
  ethereum: connectToEth,
  polkadot: connectToPolkadot,
  tron: connectToTron,
};

export const connect: ConnectFn<Connection> = (network, chainId) => {
  const category = getNetworkCategory(network);

  if (category === null) {
    return EMPTY;
  }

  return config[category](network, chainId);
};
