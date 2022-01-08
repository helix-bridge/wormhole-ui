import { isEqual } from 'lodash';
import { ComingSoon } from '../../components/ComingSoon';
import { BRIDGES } from '../../config';
import { BridgePredicateFn, ChainConfig, Departure, TransferNetwork } from '../../model';
import { chainConfigToVertices, getArrival, isEthereumNetwork, isPolkadotNetwork } from '../network';

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

function getBridge([departure, arrival]: [Departure, Departure]) {
  const direction = [departure, arrival];
  const bridge = BRIDGES.find((item) => isEqual(item.issuing, direction) || isEqual(item.redeem, direction)) ?? null;

  return bridge;
}

export function getBridgeComponent(type: 'crossChain' | 'record') {
  // eslint-disable-next-line complexity
  return (transfer: TransferNetwork) => {
    const { from, to } = transfer;

    if (!from || !to) {
      return null;
    }

    const departure = chainConfigToVertices(from);
    const arrival = chainConfigToVertices(to);
    const direction = [departure, arrival] as [Departure, Departure];
    const bridge = getBridge(direction);

    if (!bridge) {
      return ComingSoon;
    }

    switch (type) {
      case 'record':
        return isEqual(bridge.issuing, direction) ? bridge.IssuingRecordComponent : bridge.RedeemRecordComponent;
      default:
        return isEqual(bridge.issuing, direction)
          ? bridge.IssuingCrossChainComponent
          : bridge.RedeemCrossChainComponent;
    }
  };
}
