import { useMemo } from 'react';
import { RecordComponentProps } from '../../config';
import { BurnRecord, NetConfig, NoNullFields } from '../../model';
import { convertToSS58, getNetworkMode } from '../../utils';
import { CrosseState, ProgressDetail } from './ProgressDetail';
import { Record } from './Record';

/**
 * Completed step should be:
 * origin chain:  result 0 -> unconfirmed ->  step 1
 * -             1: querying in target -> step 2
 * target chain:  some event by message_id from origin chain -> found -> step 4
 *
 * FIXME: Can not find the corresponding event on target chain, because the message_id is missing;
 */
// eslint-disable-next-line complexity
export function S2SRecord({
  record,
  network: departure,
  arrival,
}: NoNullFields<RecordComponentProps<BurnRecord> & { arrival: NetConfig }>) {
  const { transaction, amount, result, end_timestamp, start_timestamp, recipient } = record;
  const step = result === 0 ? CrosseState.pending : CrosseState.claimed;
  const isRedeem = useMemo(() => getNetworkMode(departure) === 'dvm', [departure]);

  return (
    <Record
      from={{ network: departure.name, txHash: transaction }}
      to={{ network: arrival.name, txHash: transaction }}
      hasRelay={false}
      step={step}
      blockTimestamp={+(end_timestamp || start_timestamp || Date.now())}
      recipient={isRedeem ? convertToSS58(recipient, arrival.ss58Prefix) : recipient}
      assets={[{ amount, currency: isRedeem ? 'mRing' : 'oRing', unit: 'gwei' }]}
    >
      <ProgressDetail
        from={{ network: departure.name, txHash: transaction }}
        to={{ network: departure.name, txHash: transaction }}
        hasRelay={false}
        step={step}
        stepDescriptions={{ originConfirmed: '{{chain}} Locked' }}
      />
    </Record>
  );
}
