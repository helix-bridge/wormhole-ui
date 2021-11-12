import { BridgePredicateFn, ChainConfig } from '../../model';
import { getArrival, isEthereumNetwork, isPolkadotNetwork } from '../network';

export const isSubstrate2SubstrateDVM: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isPolkadotNetwork(arrival.network) && arrival.mode === 'dvm';
};

export const isSubstrateDVM2Substrate: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isPolkadotNetwork(arrival.network) && departure.mode === 'dvm';
};

export const isEthereum2Darwinia: BridgePredicateFn = (departure, arrival) => {
  return isEthereumNetwork(departure.network) && isPolkadotNetwork(arrival.network) && arrival.mode === 'native';
};

export const isDarwinia2Ethereum: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isEthereumNetwork(arrival.network) && departure.mode === 'native';
};

export const isDVM2Ethereum: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isEthereumNetwork(arrival.network) && departure.mode === 'dvm';
};

export const isEthereum2DVM: BridgePredicateFn = (departure, arrival) => {
  return isEthereumNetwork(departure.network) && isPolkadotNetwork(arrival.network) && arrival.mode === 'dvm';
};

/**
 * Shorthand functions for predication without direction
 */
export const isS2S: BridgePredicateFn = (departure, arrival) => {
  return [isSubstrate2SubstrateDVM, isSubstrateDVM2Substrate].some((fn) => fn(departure, arrival));
};

export function hasBridge(from: ChainConfig, to: ChainConfig): boolean {
  return !!getArrival(from, to);
}

export function isBridgeAvailable(from: ChainConfig, to: ChainConfig): boolean {
  const bridge = getArrival(from, to);

  return !!bridge && bridge.status === 'available';
}
