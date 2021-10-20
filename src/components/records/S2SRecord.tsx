import { useMemo } from 'react';
import { RecordComponentProps } from '../../config';
import { S2SHistoryRecord } from '../../model';
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
export function S2SRecord({ record, departure, arrival }: RecordComponentProps<S2SHistoryRecord>) {
  const { requestTxHash, responseTxHash, amount, result, endTimestamp, startTimestamp, recipient } = record;
  const step = result === 0 ? CrosseState.pending : CrosseState.claimed;
  const isRedeem = useMemo(() => departure && getNetworkMode(departure) === 'dvm', [departure]);
  const fromNetwork = useMemo(() => departure?.name || 'pangoro', [departure?.name]);
  const toNetwork = useMemo(() => arrival?.name || 'pangoro', [arrival?.name]);

  return (
    <Record
      from={{ network: fromNetwork, txHash: requestTxHash }}
      to={{ network: toNetwork, txHash: requestTxHash }}
      hasRelay={false}
      step={step}
      blockTimestamp={+(endTimestamp || startTimestamp || Date.now())}
      recipient={isRedeem ? convertToSS58(recipient, arrival?.ss58Prefix ?? null) : recipient}
      assets={[{ amount, currency: isRedeem ? 'xORING' : 'oRING', unit: 'gwei' }]}
    >
      <ProgressDetail
        from={{ network: fromNetwork, txHash: requestTxHash }}
        to={{ network: fromNetwork, txHash: responseTxHash }}
        hasRelay={false}
        step={step}
        stepDescriptions={{
          originConfirmed: { text: '{{chain}} Locked', success: true },
          targetConfirmed: {
            text: result === 1 ? '{{chain}} Confirmed' : '{{chain}} Confirm Failed',
            success: result === 1,
          },
        }}
      />
    </Record>
  );
}
