import { PolkadotChainConfig, RecordComponentProps, S2SHistoryRecord } from '../../../model';

export function SubstrateDVMRecord({
  departure,
}: RecordComponentProps<S2SHistoryRecord, PolkadotChainConfig, PolkadotChainConfig>) {
  return <div>{departure?.name}</div>;
}
