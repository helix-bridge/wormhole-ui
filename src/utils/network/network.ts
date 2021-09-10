import { curry, curryRight, isEqual, isNull, omit } from 'lodash';
import Web3 from 'web3';
import { AIRDROP_GRAPH, NETWORKS, NETWORK_ALIAS, NETWORK_CONFIG, NETWORK_GRAPH, NETWORK_SIMPLE } from '../../config';
import {
  Arrival,
  Connection,
  Departure,
  EthereumConnection,
  MetamaskNativeNetworkIds,
  NetConfig,
  Network,
  NetworkCategory,
  NetworkMode,
  PolkadotConnection,
  Vertices,
} from '../../model';

function isSpecifyNetworkType(type: NetworkCategory) {
  const findBy = (name: Network) => NETWORK_CONFIG[name] || null;

  return (network: Network | null | undefined) => {
    if (!network) {
      return false;
    }

    let config = findBy(network);

    if (!config) {
      const name = byNetworkAlias(network);

      console.warn(
        `🚀 ~ Can not find the network config by: ${network}. Treat it as an alias, find a network named ${name} by it `
      );
      if (name) {
        config = findBy(name);
      }
    }

    return config && config.type.includes(type);
  };
}

function byNetworkAlias(network: string): Network | null {
  const alias = NETWORK_ALIAS.entries();
  let res = null;

  for (const [name, value] of alias) {
    if (value.find((item) => item === network.toLowerCase())) {
      res = name;
      break;
    }
  }

  return res;
}

export function getLegalName(network: string): Network | string {
  if (NETWORK_SIMPLE.find((item) => item.name === network)) {
    return network;
  }

  return byNetworkAlias(network) || network;
}

const isSameNetwork = (net1: NetConfig | null, net2: NetConfig | null) => {
  if ([net1, net2].some(isNull)) {
    return false;
  }

  return typeof net1 === typeof net2 && net1?.fullName === net2?.fullName;
};

const getArrivals = (source: Map<Departure, Arrival[]>, departure: NetConfig) => {
  const mode: NetworkMode = getNetworkMode(departure);
  const target = [...source].find(([item]) => item.network === departure.name && item.mode === mode);

  return target ? target[1] : [];
};

const isInNodeList = (source: Map<Departure, Arrival[]>) => (net1: NetConfig | null, net2: NetConfig | null) => {
  if (!net1 || !net2) {
    return true;
  }

  const vertices = getArrivals(source, net1);
  const nets = vertices.map((ver) => ver.network);

  return nets.includes(net2.name);
};

const isInCrossList = isInNodeList(NETWORK_GRAPH);
const isInAirportList = isInNodeList(AIRDROP_GRAPH);

export const isReachable = (net: NetConfig | null, isCross = true) =>
  isCross ? curry(isInCrossList)(net) : curry(isInAirportList)(net); // relation: net1 -> net2 ---- Find the relation by net1
export const isTraceable = (net: NetConfig | null, isCross = true) =>
  isCross ? curryRight(isInCrossList)(net) : curryRight(isInAirportList)(net); // relation: net1 -> net2 ---- Find the relation by net2
export const isSameNetworkCurry = curry(isSameNetwork);
export const isPolkadotNetwork = isSpecifyNetworkType('polkadot');
export const isEthereumNetwork = isSpecifyNetworkType('ethereum');
export const isTronNetwork = isSpecifyNetworkType('tron');

export function isMetamaskInstalled(): boolean {
  return typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined';
}

/**
 * Unlike metamask, it does not lead the user to unlock the wallet.
 * Tron link may not be initialized, so if it is not detected successfully, delay 2 seconds and detect again.
 * FIXME: If the wallet status changes from unlocked to locked, the account of the last user use will still be available
 */
export async function isTronLinkReady(): Promise<boolean> {
  if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
    return true;
  }

  return await new Promise((resolve) => {
    setTimeout(() => {
      resolve(window.tronWeb && window.tronWeb.defaultAddress.base58);
      // eslint-disable-next-line no-magic-numbers
    }, 2000);
  });
}

export function getNetworkMode(config: NetConfig): NetworkMode {
  return config.dvm ? 'dvm' : 'native';
}

export function getNetConfigByVer(vertices: Vertices) {
  if (!vertices) {
    return null;
  }

  const { mode, network } = vertices;

  if (network === 'tron') {
    return NETWORK_CONFIG.tron;
  }

  return NETWORKS.find((item) => item.name === network && mode === getNetworkMode(item)) ?? null;
}

export function isSameNetConfig(config1: NetConfig | null, config2: NetConfig | null): boolean {
  if (!config1 || !config2) {
    return [config1, config2].every(isNull);
  }

  return (
    isEqual(config1, config2) || (config1.name === config2.name && getNetworkMode(config1) === getNetworkMode(config2))
  );
}

export function getNetworkByName(name: Network | null | undefined) {
  if (name) {
    return NETWORK_CONFIG[name];
  }

  console.warn('🚀 Can not find target network config by name: ', name);

  return null;
}

// eslint-disable-next-line complexity
export function getArrival(from: NetConfig | null | undefined, to: NetConfig | null | undefined): Arrival | null {
  if (!from || !to) {
    return null;
  }

  const mode = getNetworkMode(from);
  let departure = NETWORK_CONFIG[from.name];

  if (mode === 'native') {
    departure = omit(departure, 'dvm');
  }

  if (mode === 'dvm' && !Object.prototype.hasOwnProperty.call(departure, 'dvm')) {
    console.warn('Try to get arrival config in dvm mode, but the config does not include dvm info');
  }

  return getArrivals(NETWORK_GRAPH, departure).find((item) => item.network === to.name) ?? null;
}

export async function isNetworkConsistent(network: Network, id = ''): Promise<boolean> {
  id = id && Web3.utils.isHex(id) ? parseInt(id, 16).toString() : id;
  // id 1: eth mainnet 3: ropsten 4: rinkeby 5: goerli 42: kovan  43: pangolin 44: crab
  const actualId: string = id ? await Promise.resolve(id) : await window.ethereum.request({ method: 'net_version' });
  const storedId = NETWORK_CONFIG[network].ethereumChain.chainId;

  return storedId === actualId;
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

export function hasBridge(from: NetConfig, to: NetConfig): boolean {
  return !!getArrival(from, to);
}

export function isBridgeAvailable(from: NetConfig, to: NetConfig): boolean {
  const bridge = getArrival(from, to);

  return !!bridge && bridge.status === 'available';
}

export function getNetworkCategory(config: NetConfig): NetworkCategory | null {
  if (config.type.includes('polkadot')) {
    return config.dvm ? 'dvm' : 'polkadot';
  } else if (config.type.includes('ethereum')) {
    return 'ethereum';
  } else if (config.type.includes('tron')) {
    return 'tron';
  }

  return null;
}

/**
 * @returns - current active account in metamask;
 */
export async function getMetamaskActiveAccount() {
  if (typeof window.ethereum === 'undefined') {
    return;
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });

  const accounts = await window.ethereum.request({
    method: 'eth_accounts',
  });

  // metamask just return the active account now, so the result array contains only one account;
  return accounts[0];
}

/**
 *
 * @params network id
 * @description is acutal network id match with expected.
 */
export async function isNetworkMatch(expectNetworkId: number): Promise<boolean> {
  const web3 = new Web3(window.ethereum);
  const networkId = await web3.eth.net.getId();

  return expectNetworkId === networkId;
}

export function getAvailableNetworks(net: Network): NetConfig | null {
  // FIXME: by default we use the first vertices here.
  const [vertices] = (getArrivals(NETWORK_GRAPH, NETWORK_CONFIG[net]) ?? []).filter(
    (item) => item.status === 'available'
  );

  if (!vertices) {
    return null;
  }

  return NETWORK_CONFIG[vertices.network];
}

export function getDisplayName(config: NetConfig): string {
  const mode = getNetworkMode(config);

  return mode === 'dvm' ? `${config.fullName}-Smart` : config.fullName;
}

export function getVerticesFromDisplayName(name: string): Vertices {
  const [network, mode] = name.split('-') as [Network, string];

  return { network, mode: ['smart', 'dvm'].includes(mode?.toLowerCase()) ? 'dvm' : 'native' };
}

// eslint-disable-next-line complexity
export async function getConfigByConnection(connection: Connection): Promise<NetConfig | null> {
  if (connection.type === 'metamask') {
    const targets = NETWORKS.filter((item) =>
      isChainIdEqual(item.ethereumChain.chainId, (connection as EthereumConnection).chainId)
    );

    return (targets.length > 1 ? targets.find((item) => item.dvm) : targets[0]) ?? null;
  }

  if (connection.type === 'polkadot') {
    const { api } = connection as PolkadotConnection;

    try {
      const chain = await api?.rpc.system.chain();

      return chain ? omit(NETWORK_CONFIG[chain.toHuman()?.toLowerCase() as Network], 'dvm') : null;
    } catch (err) {
      console.error('%c [ err ]-263', 'font-size:13px; background:pink; color:#bf2c9f;', err);
    }
  }

  if (connection.type === 'tron') {
    return NETWORK_CONFIG.tron;
  }

  return null;
}

export function isChainIdEqual(id1: string | number, id2: string | number): boolean {
  id1 = Web3.utils.toHex(id1);
  id2 = Web3.utils.toHex(id2);

  return id1 === id2;
}
