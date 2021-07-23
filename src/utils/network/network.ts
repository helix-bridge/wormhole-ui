import { ApiPromise } from '@polkadot/api';
import type ExtType from '@polkadot/extension-inject/types';
import BN from 'bn.js';
import { curry, curryRight, isUndefined } from 'lodash';
import Web3 from 'web3';
import { NetworkEnum, NETWORK_CONFIG, NETWORK_GRAPH } from '../../config';
import { NetConfig, Network, NetworkType } from '../../model';
import ktonABI from './abi/ktonABI.json';

export interface Connection {
  accounts: ExtType.InjectedAccountWithMeta[];
  api: ApiPromise | null;
  networkStatus: ConnectStatus;
}

export type ConnectStatus = 'pending' | 'connecting' | 'success' | 'fail' | 'disconnected';

export type TokenBalance = [string, string];

interface DepositKtonOptions {
  withdrawAddress: string;
  erc20Address: string;
  isManually?: boolean;
}

// const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

function isSpecifyNetworkType(type: NetworkType) {
  return (network: Network | null) => {
    if (!network) {
      return false;
    }

    const config = NETWORK_CONFIG[network];

    if (!config) {
      console.warn('🚀 ~ can not find the network config by type: ', network);
      return false;
    }

    return config.type.includes(type);
  };
}

export const isSameNetwork = (net1: NetConfig | undefined, net2: NetConfig | undefined) => {
  if ([net1, net2].some(isUndefined)) {
    return false;
  }

  return typeof net1 === typeof net2 && net1?.fullName === net2?.fullName;
};

export const isInNodeList = (net1: NetConfig | undefined, net2: NetConfig | undefined) => {
  if (!net1 || !net2) {
    return true;
  }

  const vertices = NETWORK_GRAPH.get(NetworkEnum[net1.name]) ?? [];
  const nets = vertices.map((ver) => ver.network);

  return nets.includes(net2.name);
};

export const isReachable = curry(isInNodeList); // relation: net1 -> net2 ---- Find the relation by net1
export const isTraceable = curryRight(isInNodeList); // relation: net1 -> net2 ---- Find the relation by net2
export const isSameNetworkCurry = curry(isSameNetwork);
export const isPolkadotNetwork = isSpecifyNetworkType('polkadot');
export const isEthereumNetwork = isSpecifyNetworkType('ethereum');

export function isMetamaskInstalled(): boolean {
  return typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined';
}

export function getNetworkByName(name: Network | null | undefined) {
  if (name) {
    return NETWORK_CONFIG[name];
  }

  console.warn('🚀 Can not find target network config by name: ', name);

  return null;
}

export async function isNetworkConsistent(network: Network, id = ''): Promise<boolean> {
  id = Web3.utils.isHex(id) ? parseInt(id, 16).toString() : id;
  // id 1: eth mainnet 3: ropsten 4: rinkeby 5: goerli 42: kovan  43: pangolin 44: crab
  const actualId: string = id ? await Promise.resolve(id) : await window.ethereum.request({ method: 'net_version' });

  return parseInt(NETWORK_CONFIG[network].ethereumChain.chainId, 16).toString() === actualId;
}

/**
 * @description add chain in metamask
 */
export async function addEthereumChain(network: Network) {
  const params = NETWORK_CONFIG[network].ethereumChain;

  try {
    const result = await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    });

    return result;
  } catch (err) {
    console.warn('%c [ err ]-199', 'font-size:13px; background:pink; color:#bf2c9f;', err);
  }
}

/* ================================================Unused below=================================================== */

export async function getTokenBalanceDarwinia(api: ApiPromise, account = ''): Promise<TokenBalance> {
  try {
    await api?.isReady;
    // type = 0 query ring balance.  type = 1 query kton balance.
    /* eslint-disable */
    const ringUsableBalance = await (api?.rpc as any).balances.usableBalance(0, account);
    const ktonUsableBalance = await (api?.rpc as any).balances.usableBalance(1, account);
    /* eslint-enable */

    return [ringUsableBalance.usableBalance.toString(), ktonUsableBalance.usableBalance.toString()];
  } catch (error) {
    return ['0', '0'];
  }
}

// export function connectFactory(
//   successFn: (accounts: IAccountMeta[]) => void,
//   t: TFunction,
//   indicator?: (status: ConnectStatus) => void
// ): (network: NetworkType, accountType: AccountType) => Promise<void> {
//   return async (network: NetworkType, accountType: AccountType) => {
//     const connect = accountType === 'substrate' ? connectSubstrate : connectEth;

//     indicator('connecting');

//     connect(network)
//       .then(({ accounts }) => {
//         successFn(accounts);
//         indicator('success');
//       })
//       .catch((error) => {
//         message.error(t('Unable to connect to {{type}} network.', { type: network }));
//         console.error(error.message);
//         indicator('fail');
//       });
//   };
// }

export async function getTokenBalanceEth(ktonAddress: string, account = ''): Promise<TokenBalance> {
  const web3 = new Web3(window.ethereum);
  let ring = '0';
  let kton = '0';

  try {
    ring = await web3.eth.getBalance(account);
  } catch (error) {
    console.error(
      '%c [ get ring balance in ethereum error ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      error.message
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ktonContract = new web3.eth.Contract(ktonABI as any, ktonAddress, { gas: 55000 });

    kton = await ktonContract.methods.balanceOf(account).call();
  } catch (error) {
    console.error(
      '%c [ get kton balance in ethereum error ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      error.message
    );
  }

  return [ring, kton];
}

/**
 * @param account receive account - metamask current active account;
 * @param amount receive amount
 * @returns transaction hash
 */
export async function depositKton(
  account: string,
  amount: BN,
  { withdrawAddress, erc20Address }: DepositKtonOptions
): Promise<string> {
  const web3 = new Web3(window.ethereum || window.web3.currentProvider);
  const result = web3.eth.abi.encodeParameters(['address', 'uint256'], [erc20Address, amount.toString()]);
  // eslint-disable-next-line no-magic-numbers
  const data = '0x3225da29' + result.substr(2);
  const gas = 100000;

  const txHash = await web3.eth.sendTransaction({
    from: account,
    to: withdrawAddress,
    data,
    value: '0x00',
    gas,
  });

  return txHash.transactionHash;
}
