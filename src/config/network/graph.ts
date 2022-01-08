import { isEqual } from 'lodash';
import { Arrival, Bridge, Departure } from '../../model';
import { BRIDGES } from '../bridge';

const isPro = process.env.REACT_APP_HOST_TYPE === 'prod';

export const NETWORK_GRAPH = new Map(
  BRIDGES.reduce((acc: [Departure, Arrival[]][], bridge: Bridge) => {
    if (isPro && !bridge.stable) {
      return acc;
    }

    const check = (ver1: Departure, ver2: Departure) => {
      const departure = acc.find((item) => isEqual(item[0], ver1));
      if (departure) {
        departure[1].push(ver2);
      } else {
        acc.push([{ ...ver1 }, [{ ...ver2 }]]);
      }
    };

    check(bridge.departure, bridge.arrival);
    check(bridge.arrival, bridge.departure);

    return acc;
  }, [])
);

export const AIRDROP_GRAPH = new Map<Departure, Arrival[]>([
  [{ network: 'ethereum', mode: 'native' }, [{ network: 'crab', mode: 'native' }]],
  [{ network: 'tron', mode: 'native' }, [{ network: 'crab', mode: 'native' }]],
]);
