import { isEqual } from 'lodash';
import React, { FunctionComponent } from 'react';
import { RecordComponentProps } from '../config';
import { BridgeFormProps, Departure, TransferNetwork } from '../model';
import { getNetworkMode } from '../utils';
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
  [Departure, Departure?],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FunctionComponent<BridgeFormProps<any>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FunctionComponent<RecordComponentProps<any>>
];

enum ComponentIndex {
  bridge = 1,
  record,
}

const BRIDGES: BridgeComponents[] = [
  [[{ network: 'ethereum', mode: 'native' }], Ethereum2Darwinia, E2DRecord],
  [[{ network: 'ropsten', mode: 'native' }], Ethereum2Darwinia, E2DRecord],
  [[{ network: 'darwinia', mode: 'native' }], Darwinia2Ethereum, D2ERecord],
  [[{ network: 'pangolin', mode: 'native' }], Darwinia2Ethereum, D2ERecord],
  [
    [
      { network: 'ethereum', mode: 'native' },
      { network: 'darwinia', mode: 'dvm' },
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
  [[{ network: 'darwinia', mode: 'dvm' }], DarwiniaDVM2Ethereum, D2ERecord],
  [[{ network: 'pangolin', mode: 'dvm' }], DarwiniaDVM2Ethereum, D2ERecord],
  [[{ network: 'pangoro', mode: 'native' }], Substrate2SubstrateDVM, S2SRecord],
  [
    [
      { network: 'pangolin', mode: 'dvm' },
      { network: 'pangoro', mode: 'native' },
    ],
    SubstrateDVM2Substrate,
    S2SRecord,
  ],
];

// eslint-disable-next-line complexity
export function findBridge({ from, to }: TransferNetwork) {
  if (!from) {
    return null;
  }

  const fMode = getNetworkMode(from);

  if (!to) {
    const target = BRIDGES.find(([parties]) => isEqual(parties[0], { network: from.name, mode: fMode }));

    if (target) {
      return target;
    }
  } else {
    const targets = BRIDGES.filter(([parties]) => isEqual(parties[0], { network: from.name, mode: fMode }));

    if (targets.length === 1) {
      return targets[0];
    } else {
      const tMode = getNetworkMode(to);
      const target =
        targets.find(([parties]) => isEqual(parties[1], { network: to.name, mode: tMode })) ||
        targets.find(([parties]) => parties[1] === undefined && tMode === 'native');

      if (target) {
        return target;
      }
    }
  }

  return null;
}

export const getBridge = (transfer: TransferNetwork) => {
  const result = findBridge(transfer) ?? [];

  return result[ComponentIndex.bridge] ?? (() => <span>Coming Soon...</span>);
};

export const getRecord = (transfer: TransferNetwork) => {
  const result = findBridge(transfer) ?? [];

  return result[ComponentIndex.record] ?? (() => <span>Coming Soon...</span>);
};
