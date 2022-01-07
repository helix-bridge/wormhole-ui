import { isEqual } from 'lodash';
import { FunctionComponent } from 'react';
import {
  Bridge,
  BRIDGES,
  darwiniaCrabDVM,
  ethereumCrabDVM,
  ethereumDarwinia,
  pangoroPangolinDVM,
  ropstenPangolin,
  ropstenPangolinDVM,
} from '../../config';
import { TransferNetwork } from '../../model';
import { chainConfigToVertices } from '../../utils';
import { D2ERecord } from '../records/D2ERecord';
import { E2DRecord } from '../records/E2DRecord';
import { S2SRecord } from '../records/S2SRecord';
import { Darwinia2Ethereum } from './ethereum-darwinia/Darwinia2Ethereum';
import { Ethereum2Darwinia } from './ethereum-darwinia/Ethereum2Darwinia';
import { DarwiniaDVM2Ethereum } from './ethereum-dvm/DarwiniaDVM2Ethereum';
import { Ethereum2DarwiniaDVM } from './ethereum-dvm/Ethereum2DarwiniaDVM';
import { Substrate2SubstrateDVM } from './substrate-substrateDVM/Substrate2SubstrateDVM';
import { SubstrateDVM2Substrate } from './substrate-substrateDVM/SubstrateDVM2Substrate';

/**
 * ethereum <-> darwinia
 */
ethereumDarwinia.setIssuingComponents(Ethereum2Darwinia as FunctionComponent, E2DRecord as FunctionComponent);
ethereumDarwinia.setRedeemComponents(Darwinia2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);
ropstenPangolin.setIssuingComponents(Ethereum2Darwinia as FunctionComponent, E2DRecord as FunctionComponent);
ropstenPangolin.setRedeemComponents(Darwinia2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);

/**
 * substrate <-> substrate dvm
 */
darwiniaCrabDVM.setIssuingComponents(Substrate2SubstrateDVM as FunctionComponent, S2SRecord as FunctionComponent);
darwiniaCrabDVM.setRedeemComponents(SubstrateDVM2Substrate as FunctionComponent, S2SRecord as FunctionComponent);
pangoroPangolinDVM.setIssuingComponents(Substrate2SubstrateDVM as FunctionComponent, S2SRecord as FunctionComponent);
pangoroPangolinDVM.setRedeemComponents(SubstrateDVM2Substrate as FunctionComponent, S2SRecord as FunctionComponent);

/**
 * ethereum <-> crab dvm
 */
ethereumCrabDVM.setIssuingComponents(Ethereum2DarwiniaDVM as FunctionComponent, E2DRecord as FunctionComponent);
ethereumCrabDVM.setRedeemComponents(DarwiniaDVM2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);
ropstenPangolinDVM.setIssuingComponents(Ethereum2DarwiniaDVM as FunctionComponent, E2DRecord as FunctionComponent);
ropstenPangolinDVM.setRedeemComponents(DarwiniaDVM2Ethereum as FunctionComponent, D2ERecord as FunctionComponent);

function findBridge({ from, to }: TransferNetwork) {
  if (!from) {
    return null;
  }

  const departure = chainConfigToVertices(from);
  let bridge: Bridge | null = null;

  if (!to) {
    bridge = BRIDGES.find((item) => isEqual(item.departure, departure)) ?? null;
  } else {
    const arrival = chainConfigToVertices(to);
    const direction = [departure, arrival];

    bridge =
      BRIDGES.find(
        (item) =>
          isEqual([item.departure, item.arrival], direction) || isEqual([item.arrival, item.departure], direction)
      ) ?? null;
  }

  return bridge;
}

function getComponent(type: 'crossChain' | 'record') {
  return function (transfer: TransferNetwork) {
    const bridge = findBridge(transfer);

    if (!bridge) {
      return (() => <span>Coming Soon...</span>) as FunctionComponent;
    }

    switch (type) {
      case 'record':
        return isEqual(bridge.departure, chainConfigToVertices(transfer.from!))
          ? bridge.IssuingRecordComponent
          : bridge.RedeemRecordComponent;
      default:
        return isEqual(bridge.departure, chainConfigToVertices(transfer.from!))
          ? bridge.IssuingCrossChainComponent
          : bridge.RedeemCrossChainComponent;
    }
  };
}

export const getBridgeComponent = getComponent('crossChain');

export const getRecordComponent = getComponent('record');
