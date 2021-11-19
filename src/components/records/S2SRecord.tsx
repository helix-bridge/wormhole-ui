import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Subscription, switchMapTo, tap } from 'rxjs';
import { RecordComponentProps } from '../../config';
import { useS2SRecords } from '../../hooks';
import { ApiKeys, PolkadotConfig, S2SBurnRecordRes, S2SHistoryRecord, S2SIssuingRecordRes } from '../../model';
import {
  convertToSS58,
  fromWei,
  getNetworkMode,
  isSubstrate2SubstrateDVM,
  netConfigToVertices,
  toWei,
} from '../../utils';
import { Progresses, ProgressProps, State } from './Progress';
import { Record } from './Record';

enum ProgressPosition {
  send,
  originLocked,
  targetDelivered,
  originConfirmed,
}

export function S2SRecord({
  record,
  departure,
  arrival,
}: RecordComponentProps<S2SHistoryRecord, PolkadotConfig<ApiKeys>, PolkadotConfig<ApiKeys>>) {
  const { t } = useTranslation();
  const { fetchS2SIssuingRecord, fetchS2SRedeemRecord, fetchS2SIssuingMappingRecord, fetchS2SUnlockRecord } =
    useS2SRecords(departure!, arrival!);
  const isRedeem = useMemo(() => departure && getNetworkMode(departure) === 'dvm', [departure]);

  const [progresses, setProgresses] = useState<ProgressProps[]>(() => {
    const { requestTxHash, responseTxHash, result } = record;

    const transactionSend: ProgressProps = {
      title: t('{{chain}} Sent', { chain: departure?.name }),
      steps: [{ name: '', state: State.completed }],
      network: departure,
    };

    const originLocked: ProgressProps = {
      title: t('{{chain}} Locked', { chain: departure?.name }),
      steps: [
        {
          name: 'locked',
          state: requestTxHash ? State.completed : State.pending,
          txHash: requestTxHash,
        },
      ],
      network: departure,
      icon: 'lock.svg',
    };

    const targetDelivered: ProgressProps = {
      title: t('{{chain}} Delivered', { chain: arrival?.name }),
      steps: [{ name: 'confirmed', state: State.pending, txHash: undefined }],
      network: arrival,
    };

    const originConfirmed: ProgressProps = {
      title: t(result === State.error ? '{{chain}} Confirm Failed' : '{{chain}} Confirmed', { chain: departure?.name }),
      steps: [{ name: 'confirmed', state: result, txHash: responseTxHash }],
      network: departure,
    };

    return [transactionSend, originLocked, targetDelivered, originConfirmed]; // make sure the order is consist with position defined in ProgressPosition
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
      steps: [{ name: 'confirmed', state: originConfirmResult, txHash: originResponseTx }],
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
        updateProgresses(ProgressPosition.targetDelivered, res);
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
          updateProgresses(ProgressPosition.targetDelivered, res);
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
