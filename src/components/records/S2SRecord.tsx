import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Subscription, switchMapTo, tap } from 'rxjs';
import { RecordComponentProps } from '../../config';
import { useS2SRecords } from '../../hooks';
import { PolkadotConfig, S2SBurnRecordRes, S2SHistoryRecord, S2SIssuingRecordRes } from '../../model';
import {
  convertToSS58,
  fromWei,
  getNetworkMode,
  isSubstrate2SubstrateDVM,
  netConfigToVertices,
  toWei,
} from '../../utils';
import { iconsMap, Progresses, ProgressProps, State, transactionSend } from './Progress';
import { Record } from './Record';

enum ProgressPosition {
  send,
  originLocked,
  originConfirmed,
  targetResponded,
}

export function S2SRecord({
  record,
  departure,
  arrival,
}: RecordComponentProps<S2SHistoryRecord, PolkadotConfig, PolkadotConfig>) {
  const { t } = useTranslation();
  const { fetchS2SIssuingRecord, fetchS2SRedeemRecord, fetchS2SIssuingMappingRecord, fetchS2SUnlockRecord } =
    useS2SRecords(departure!, arrival!);
  const isRedeem = useMemo(() => departure && getNetworkMode(departure) === 'dvm', [departure]);
  // eslint-disable-next-line complexity
  const [progresses, setProgresses] = useState<ProgressProps[]>(() => {
    const { requestTxHash, responseTxHash, result } = record;
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

    const targetResponded: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: arrival?.name }),
      Icon: iconsMap[arrival?.name ?? 'pangoro'],
      steps: [{ name: 'confirmed', state: State.pending, tx: undefined }],
      network: arrival,
    };

    return [transactionSend, originLocked, originConfirmed, targetResponded]; // make sure the order is consist with position defined in ProgressPosition
  });
  const { count, currency } = useMemo<{ count: string; currency: string }>(
    () =>
      isRedeem
        ? { count: record.amount, currency: 'xORING' }
        : { count: toWei({ value: record.amount, unit: 'gwei' }), currency: 'ORING' },
    [record.amount, isRedeem]
  );
  const updateProgresses = useCallback((idx: number, res: S2SHistoryRecord) => {
    const { result: originConfirmResult, responseTxHash: originResponseTx } = res;
    const data = [...progresses];

    data[idx] = {
      ...data[idx],
      steps: [{ name: 'confirmed', state: originConfirmResult, tx: originResponseTx }],
    };

    setProgresses(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { messageId, result } = record;
    const attemptsCount = 100;
    const isS2DVM = isSubstrate2SubstrateDVM(netConfigToVertices(departure!), netConfigToVertices(arrival!));
    const queryTargetRecord = isS2DVM ? fetchS2SIssuingMappingRecord : fetchS2SUnlockRecord;
    const queryOriginRecord = isS2DVM ? fetchS2SIssuingRecord : fetchS2SRedeemRecord;
    let subscription: Subscription | null = null;

    if (record.result === State.completed) {
      subscription = queryTargetRecord(messageId, { attemptsCount }).subscribe((res) => {
        updateProgresses(ProgressPosition.targetResponded, res);
      });
    }

    // If start from pending start, polling until origin chain state change, then polling until the event emit on the target chain.
    if (record.result === State.pending) {
      subscription = queryOriginRecord(messageId, {
        attemptsCount,
        keepActive: (res) => {
          const event = (res as S2SBurnRecordRes).burnRecordEntity || (res as S2SIssuingRecordRes).s2sEvent;

          return event.result === result;
        },
        skipCache: true,
      })
        .pipe(
          tap((res) => updateProgresses(ProgressPosition.originConfirmed, res)),
          switchMapTo(queryTargetRecord(messageId, { attemptsCount: 200 }))
        )
        .subscribe((res) => {
          updateProgresses(ProgressPosition.targetResponded, res);
        });
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Record
      departure={departure}
      arrival={arrival}
      blockTimestamp={+(record.endTimestamp || record.startTimestamp || Date.now())}
      recipient={isRedeem ? convertToSS58(record.recipient, arrival?.ss58Prefix ?? null) : record.recipient}
      assets={[{ amount: fromWei({ value: count, unit: 'gwei' }), currency, unit: 'gwei' }]}
      items={progresses}
    >
      <Progresses items={progresses} />
    </Record>
  );
}
