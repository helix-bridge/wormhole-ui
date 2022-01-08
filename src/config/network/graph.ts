import { Arrival, Departure } from '../../model';

export const NETWORK_GRAPH = new Map<Departure, Arrival[]>([
  [{ network: 'crab', mode: 'native' }, [{ network: 'darwinia', status: 'pending', mode: 'native' }]],
  [
    { network: 'crab', mode: 'dvm' },
    [
      { network: 'darwinia', status: 'available', mode: 'native', stable: true },
      { network: 'ethereum', status: 'available', mode: 'native' },
    ],
  ],
  [
    { network: 'darwinia', mode: 'native' },
    [
      { network: 'ethereum', status: 'available', mode: 'native', stable: true },
      { network: 'crab', status: 'available', mode: 'dvm', stable: true },
    ],
  ],
  [
    { network: 'ethereum', mode: 'native' },
    [
      { network: 'darwinia', status: 'available', mode: 'native' },
      { network: 'crab', status: 'available', mode: 'dvm' },
    ],
  ],
  [
    { network: 'pangolin', mode: 'native' },
    [{ network: 'ropsten', status: 'available', mode: 'native', stable: true }],
  ],
  [
    { network: 'pangolin', mode: 'dvm' },
    [
      { network: 'ropsten', status: 'available', mode: 'native' },
      { network: 'pangoro', status: 'available', mode: 'native', stable: true },
    ],
  ],
  [{ network: 'pangoro', mode: 'native' }, [{ network: 'pangolin', status: 'available', mode: 'dvm', stable: true }]],
  [
    { network: 'ropsten', mode: 'native' },
    [
      { network: 'pangolin', status: 'available', mode: 'native', stable: true },
      { network: 'pangolin', status: 'available', mode: 'dvm' },
    ],
  ],
]);
