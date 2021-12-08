import { omit } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Subscription, switchMapTo, tap } from 'rxjs';
import { RecordComponentProps } from '../../config';
import { useS2SRecords } from '../../hooks';
import { ApiKeys, PolkadotConfig, S2SBurnRecordRes, S2SHistoryRecord, S2SIssuingRecordRes } from '../../model';
import { convertToSS58, getNetworkMode, isSubstrate2SubstrateDVM, netConfigToVertices } from '../../utils';
import { IndexingState, Progresses, ProgressProps, State } from './Progress';
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
  const {
    fetchS2SIssuingRecord,
    fetchS2SRedeemRecord,
    fetchS2SIssuingMappingRecord,
    fetchS2SUnlockRecord,
    fetchMessageEvent,
  } = useS2SRecords(departure!, arrival!);
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
      title: t(result === State.error ? '{{chain}} Deliver Failed' : '{{chain}} Delivered', { chain: arrival?.name }),
      steps: [{ name: 'confirmed', state: result, txHash: undefined, indexing: IndexingState.indexing }],
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
    () => ({ count: record.amount, currency: isRedeem ? 'xORING' : 'ORING' }),
    [record.amount, isRedeem]
  );
  /**
   * undefined: no query result;
   * null: no result until polling finished.
   */
  const [deliveredRecord, setDeliveredRecord] = useState<S2SHistoryRecord | null | undefined>();
  const [confirmedRecord, setConfirmedRecord] = useState<S2SHistoryRecord | null | undefined>();

  const updateProgresses = useCallback((idx: number, res: S2SHistoryRecord | null, source: ProgressProps[]) => {
    const data = [...source];

    if (!res) {
      data[idx] = {
        ...data[idx],
        steps: data[idx].steps.map((step) =>
          step.txHash ? omit(step, 'indexing') : { ...step, indexing: IndexingState.indexingCompleted }
        ),
      };
    } else {
      const { result: originConfirmResult, responseTxHash: originResponseTx } = res;

      data[idx] = {
        ...data[idx],
        steps: [{ name: 'confirmed', state: originConfirmResult, txHash: originResponseTx }],
      };
    }

    return data;
  }, []);

  useEffect(() => {
    const { laneId, nonce, result } = record;
    const attemptsCount = 100;
    const isS2DVM = isSubstrate2SubstrateDVM(netConfigToVertices(departure!), netConfigToVertices(arrival!));
    const queryTargetRecord = isS2DVM ? fetchS2SIssuingMappingRecord : fetchS2SUnlockRecord;
    const queryOriginRecord = isS2DVM ? fetchS2SIssuingRecord : fetchS2SRedeemRecord;
    const observer = {
      next: (res: S2SHistoryRecord) => {
        setDeliveredRecord(res);
      },
      complete: () => {
        setDeliveredRecord(null);
      },
    };
    let subscription: Subscription | null = null;

    if (record.result === State.completed) {
      subscription = queryTargetRecord(laneId, nonce, { attemptsCount }).subscribe(observer);
    }

    /**
     * Polling events of `bridgeDispatch` section, if MessageDispatched event occurred and it's result is ok, deliver success
     * other events represents failed.
     */
    if (record.result === State.pending) {
      subscription = fetchMessageEvent(laneId, nonce, { attemptsCount })
        .pipe(
          tap((res) => {
            const { isSuccess } = res;
            return setDeliveredRecord({
              ...record,
              result: isSuccess ? State.completed : State.error,
            } as S2SHistoryRecord);
          }),
          switchMapTo(
            queryOriginRecord(laneId, nonce, {
              attemptsCount,
              keepActive: (res) => {
                const event = (res as S2SBurnRecordRes).burnRecordEntity || (res as S2SIssuingRecordRes).s2sEvent;

                return event.result === result;
              },
              skipCache: true,
            }).pipe(tap((res) => setConfirmedRecord(res)))
          ),
          switchMapTo(queryTargetRecord(laneId, nonce, { attemptsCount }))
        )
        .subscribe(observer);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deliveredRecord !== undefined) {
      const current = updateProgresses(ProgressPosition.targetDelivered, deliveredRecord, progresses);

      setProgresses(current);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveredRecord]);

  useEffect(() => {
    if (confirmedRecord !== undefined) {
      const current = updateProgresses(ProgressPosition.targetDelivered, confirmedRecord, progresses);

      setProgresses(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedRecord]);

  return (
    <Record
      departure={departure}
      arrival={arrival}
      blockTimestamp={+(record.endTimestamp || record.startTimestamp || Date.now())}
      recipient={isRedeem ? convertToSS58(record.recipient, arrival?.ss58Prefix ?? null) : record.recipient}
      assets={[{ amount: count, currency, unit: 'gwei' }]}
      items={progresses}
    >
      <Progresses items={progresses} />
    </Record>
  );
}
