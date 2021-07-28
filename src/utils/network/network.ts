import { ApiPromise } from '@polkadot/api';
import type ExtType from '@polkadot/extension-inject/types';
import { curry, curryRight, isNull } from 'lodash';
import Web3 from 'web3';
import { NetworkEnum, NETWORK_CONFIG, NETWORK_GRAPH, Vertices } from '../../config';
import { MetamaskNativeNetworkIds, NetConfig, Network, NetworkType } from '../../model';

export interface Connection {
  accounts: ExtType.InjectedAccountWithMeta[];
  api: ApiPromise | null;
  networkStatus: ConnectStatus;
}

export type ConnectStatus = 'pending' | 'connecting' | 'success' | 'fail' | 'disconnected';

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

export const isSameNetwork = (net1: NetConfig | null, net2: NetConfig | null) => {
  if ([net1, net2].some(isNull)) {
    return false;
  }

  return typeof net1 === typeof net2 && net1?.fullName === net2?.fullName;
};

export const isInNodeList = (net1: NetConfig | null, net2: NetConfig | null) => {
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

export function getVertices(from: Network, to: Network): Vertices | null {
  if (!from || !to) {
    return null;
  }

  return NETWORK_GRAPH.get(from)?.find((item) => item.network === to) ?? null;
}

export async function isNetworkConsistent(network: Network, id = ''): Promise<boolean> {
  id = id && Web3.utils.isHex(id) ? parseInt(id, 16).toString() : id;
  // id 1: eth mainnet 3: ropsten 4: rinkeby 5: goerli 42: kovan  43: pangolin 44: crab
  const actualId: string = id ? await Promise.resolve(id) : await window.ethereum.request({ method: 'net_version' });

  return parseInt(NETWORK_CONFIG[network].ethereumChain.chainId, 16).toString() === actualId;
}

export function isNativeMetamaskChain(network: Network): boolean {
  const ids = [
    MetamaskNativeNetworkIds.ethereum,
    MetamaskNativeNetworkIds.ropsten,
    MetamaskNativeNetworkIds.rinkeby,
    MetamaskNativeNetworkIds.goerli,
    MetamaskNativeNetworkIds.kovan,
  ];
  const params = NETWORK_CONFIG[network].ethereumChain;

  return ids.includes(+params.chainId);
}

export async function switchEthereumChain(network: Network) {
  const params = NETWORK_CONFIG[network].ethereumChain;
  const res = await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: Web3.utils.toHex(+params.chainId) }],
  });

  return res;
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
