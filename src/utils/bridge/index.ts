import { has, isEqual, pick } from 'lodash';
import { ComingSoon } from '../../components/ComingSoon';
import { BRIDGES } from '../../config';
import { ChainConfig, Departure, CrossChainDirection, Vertices, Bridge, BridgeConfig } from '../../model';
import { chainConfigToVertices, isEthereumNetwork, isPolkadotNetwork } from '../network';

type BridgePredicateFn = (departure: Vertices, arrival: Vertices) => boolean;

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
  try {
    getBridge([from, to]);

    return true;
  } catch (_) {
    return false;
  }
}

export function isBridgeAvailable(from: ChainConfig, to: ChainConfig): boolean {
  const bridge = getBridge([from, to]);

  return !!bridge && bridge.status === 'available';
}

export function getBridge<T extends BridgeConfig>(
  source: CrossChainDirection | [Vertices | ChainConfig, Vertices | ChainConfig]
): Bridge<T> {
  const data = Array.isArray(source) ? source : ([source.from, source.to] as [ChainConfig, ChainConfig]);
  const direction = data.map((item) => {
    const asVertices = has(item, 'network') && has(item, 'mode');

    if (asVertices) {
      return pick(item as Vertices, ['network', 'mode']) as Vertices;
    }

    return chainConfigToVertices(item as ChainConfig);
  });
  const bridge = BRIDGES.find((item) => isEqual(item.issuing, direction) || isEqual(item.redeem, direction));

  if (!bridge) {
    throw new Error(`Bridge from ${direction[0]?.network} to ${direction[1]?.network} is not exist`);
  }

  return bridge as Bridge<T>;
}

export function getBridgeComponent(type: 'crossChain' | 'record') {
  // eslint-disable-next-line complexity
  return (dir: CrossChainDirection) => {
    const { from, to } = dir;

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
