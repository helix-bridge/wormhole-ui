import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Subscription } from 'rxjs';
import { RecordComponentProps } from '../../config';
import { useS2SRecords } from '../../hooks';
import { PolkadotConfig, S2SHistoryRecord } from '../../model';
import { convertToSS58, fromWei, getNetworkMode, toWei } from '../../utils';
import { iconsMap, Progresses, ProgressProps, State, transactionSend } from './Progress';
import { Record } from './Record';

export function S2SRecord({
  record,
  departure,
  arrival,
}: RecordComponentProps<S2SHistoryRecord, PolkadotConfig, PolkadotConfig>) {
  const { t } = useTranslation();
  const { queryS2SRecord } = useS2SRecords(departure!, arrival!);
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
  const { count, currency } = useMemo<{ count: string; currency: string }>(
    () =>
      isRedeem
        ? { count: amount, currency: 'xORING' }
        : { count: toWei({ value: amount, unit: 'gwei' }), currency: 'ORING' },
    [amount, isRedeem]
  );
  const [targetProgresses, setTargetProgress] = useState<ProgressProps[]>([]);

  useEffect(() => {
    const { messageId } = record;
    let subscription: Subscription | null = null;

    if (result === State.completed) {
      subscription = queryS2SRecord(messageId).subscribe((res) => {
        const { requestTxHash: tx } = res;
        const progress: ProgressProps = {
          title: t('{{chain}} Confirmed', { chain: arrival?.name }),
          Icon: iconsMap[arrival?.name ?? 'pangoro'],
          steps: [{ name: 'confirmed', state: State.completed, tx }],
          network: arrival,
        };

        setTargetProgress([progress]);
      });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [arrival, departure, queryS2SRecord, record, result, t]);

  return (
    <Record
      departure={departure}
      arrival={arrival}
      blockTimestamp={+(endTimestamp || startTimestamp || Date.now())}
      recipient={isRedeem ? convertToSS58(recipient, arrival?.ss58Prefix ?? null) : recipient}
      assets={[{ amount: fromWei({ value: count, unit: 'gwei' }), currency, unit: 'gwei' }]}
      items={progresses}
    >
      <Progresses items={[...progresses, ...targetProgresses]} />
    </Record>
  );
}
