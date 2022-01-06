import { isEqual } from 'lodash';
import { FunctionComponent } from 'react';
import { RecordComponentProps } from '../config';
import { BridgeFormProps, Departure, TransferNetwork, Arrival } from '../model';
import { chainConfigToVertices } from '../utils';
import { Darwinia2Ethereum } from './bridge/Darwinia2Ethereum';
import { DarwiniaDVM2Ethereum } from './bridge/DarwiniaDVM2Ethereum';
import { Ethereum2Darwinia } from './bridge/Ethereum2Darwinia';
import { Ethereum2DarwiniaDVM } from './bridge/Ethereum2DarwiniaDVM';
import { Substrate2SubstrateDVM } from './bridge/Substrate2SubstrateDVM';
import { SubstrateDVM2Substrate } from './bridge/SubstrateDVM2Substrate';
import { D2ERecord } from './records/D2ERecord';
import { E2DRecord } from './records/E2DRecord';
import { S2SRecord } from './records/S2SRecord';

type BridgeComponents = [
  [Departure, Pick<Arrival, 'network' | 'mode'>],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FunctionComponent<BridgeFormProps<any>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FunctionComponent<RecordComponentProps<any, any, any>>
];

enum ComponentIndex {
  bridge = 1,
  record,
}

const BRIDGES: BridgeComponents[] = [
  [
    [
      { network: 'ethereum', mode: 'native' },
      { network: 'darwinia', mode: 'native' },
    ],
    Ethereum2Darwinia,
    E2DRecord,
  ],
  [
    [
      { network: 'ropsten', mode: 'native' },
      { network: 'pangolin', mode: 'native' },
    ],
    Ethereum2Darwinia,
    E2DRecord,
  ],
  [
    [
      { network: 'darwinia', mode: 'native' },
      { network: 'ethereum', mode: 'native' },
    ],
    Darwinia2Ethereum,
    D2ERecord,
  ],
  [
    [
      { network: 'pangolin', mode: 'native' },
      { network: 'ropsten', mode: 'native' },
    ],
    Darwinia2Ethereum,
    D2ERecord,
  ],
  [
    [
      { network: 'darwinia', mode: 'native' },
      { network: 'crab', mode: 'dvm' },
    ],
    Substrate2SubstrateDVM,
    S2SRecord,
  ],
  [
    [
      { network: 'ethereum', mode: 'native' },
      { network: 'crab', mode: 'dvm' },
    ],
    Ethereum2DarwiniaDVM,
    E2DRecord,
  ],
  [
    [
      { network: 'ropsten', mode: 'native' },
      { network: 'pangolin', mode: 'dvm' },
    ],
    Ethereum2DarwiniaDVM,
    E2DRecord,
  ],
  [
    [
      { network: 'darwinia', mode: 'dvm' },
      { network: 'ethereum', mode: 'native' },
    ],
    DarwiniaDVM2Ethereum,
    D2ERecord,
  ],
  [
    [
      { network: 'pangolin', mode: 'dvm' },
      { network: 'ropsten', mode: 'native' },
    ],
    DarwiniaDVM2Ethereum,
    D2ERecord,
  ],
  [
    [
      { network: 'pangoro', mode: 'native' },
      { network: 'pangolin', mode: 'dvm' },
    ],
    Substrate2SubstrateDVM,
    S2SRecord,
  ],
  [
    [
      { network: 'pangolin', mode: 'dvm' },
      { network: 'pangoro', mode: 'native' },
    ],
    SubstrateDVM2Substrate,
    S2SRecord,
  ],
  [
    [
      { network: 'crab', mode: 'dvm' },
      { network: 'darwinia', mode: 'native' },
    ],
    SubstrateDVM2Substrate,
    S2SRecord,
  ],
];

function findBridge({ from, to }: TransferNetwork) {
  if (!from) {
    return null;
  }

  const departure = chainConfigToVertices(from);
  let target: BridgeComponents | null = null;

  if (!to) {
    target = BRIDGES.find(([[dep]]) => isEqual(dep, departure)) ?? null;
  } else {
    const arrival = chainConfigToVertices(to);

    target = BRIDGES.find(([[dep, arr]]) => isEqual(dep, departure) && isEqual(arr, arrival)) ?? null;
  }

  return target;
}

export const getBridge = (transfer: TransferNetwork) => {
  const result = findBridge(transfer) ?? [];

  return result[ComponentIndex.bridge] ?? (() => <span>Coming Soon...</span>);
};

export const getRecordComponent = (transfer: TransferNetwork) => {
  const result = findBridge(transfer) ?? [];

  return result[ComponentIndex.record] ?? (() => <span>Coming Soon...</span>);
};
