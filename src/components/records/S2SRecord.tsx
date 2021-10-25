import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordComponentProps } from '../../config';
import { S2SHistoryRecord } from '../../model';
import { convertToSS58, getNetworkMode } from '../../utils';
import { iconsMap, Progresses, ProgressProps, State, transactionSend } from './Progress';
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
  const { t } = useTranslation();
  const { requestTxHash, responseTxHash, amount, result, endTimestamp, startTimestamp, recipient } = record;
  const isRedeem = useMemo(() => departure && getNetworkMode(departure) === 'dvm', [departure]);
  const progresses = useMemo<ProgressProps[]>(() => {
    const originLocked: ProgressProps = {
      title: t('{{chain}} Locked', { chain: departure?.name }),
      Icon: iconsMap[departure?.name ?? 'pangoro'],
      steps: [
        {
          name: 'locked',
          state: requestTxHash ? State.completed : State.pending,
          tx: requestTxHash,
        },
      ],
      network: departure,
    };
    const originConfirmed: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: departure?.name }),
      Icon: iconsMap[departure?.name ?? 'pangoro'],
      steps: [{ name: 'confirmed', state: result, tx: responseTxHash }],
      network: departure,
    };

    return [transactionSend, originLocked, originConfirmed];
  }, [departure, requestTxHash, responseTxHash, result, t]);

  return (
    <Record
      departure={departure}
      arrival={arrival}
      blockTimestamp={+(endTimestamp || startTimestamp || Date.now())}
      recipient={isRedeem ? convertToSS58(recipient, arrival?.ss58Prefix ?? null) : recipient}
      assets={[{ amount, currency: isRedeem ? 'xORING' : 'ORING', unit: 'gwei' }]}
      items={progresses}
    >
      <Progresses items={progresses} />
    </Record>
  );
}
