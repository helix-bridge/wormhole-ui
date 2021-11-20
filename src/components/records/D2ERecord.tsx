import { upperFirst } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordComponentProps } from '../../config';
import { useTx } from '../../hooks';
import { D2EHistory as D2ERecordType, D2EMeta } from '../../model';
import { ClaimNetworkPrefix, claimToken } from '../../utils';
import { Progresses, ProgressProps, State } from './Progress';
import { Record } from './Record';

// eslint-disable-next-line complexity
export function D2ERecord({ departure, arrival, record }: RecordComponentProps<D2ERecordType & { meta: D2EMeta }>) {
  const { t } = useTranslation();
  const { observer, setTx } = useTx();
  const {
    block_timestamp,
    signatures,
    target,
    ring_value,
    kton_value,
    extrinsic_index,
    tx,
    mmr_index,
    mmr_root,
    block_header,
    block_num,
    block_hash,
    meta,
  } = record;
  const [hash, setHash] = useState('');
  const claim = useCallback(
    (monitor) => {
      setTx({ status: 'sending' });
      monitor(true);

      return claimToken({
        networkPrefix: upperFirst(departure?.name) as ClaimNetworkPrefix,
        mmrIndex: mmr_index,
        mmrRoot: mmr_root,
        mmrSignatures: signatures,
        blockNumber: block_num,
        blockHeaderStr: block_header,
        blockHash: block_hash,
        meta,
      }).subscribe({
        ...observer,
        next: (state) => {
          if (state.status === 'finalized' && state.hash) {
            setHash(hash);
          }
          observer.next(state);
        },
        error: (err) => {
          observer.next(err);
          monitor(false);
        },
        complete: () => {
          observer.complete();
          monitor(false);
        },
      });
    },
    [block_hash, block_header, block_num, departure?.name, hash, meta, mmr_index, mmr_root, observer, setTx, signatures]
  );

  // eslint-disable-next-line complexity
  const progresses = useMemo<ProgressProps[]>(() => {
    const transactionSend: ProgressProps = {
      title: t('{{chain}} Sent', { chain: departure?.name }),
      steps: [{ name: '', state: State.completed }],
      network: departure,
    };
    const originLocked: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: departure?.name }),
      steps: [
        {
          name: 'confirm',
          state: extrinsic_index ? State.completed : State.pending,
          txHash: extrinsic_index,
        },
      ],
      network: departure,
    };
    const relayerConfirmed: ProgressProps = {
      title: t('ChainRelay Confirmed'),
      steps: [
        {
          name: 'confirm',
          state: signatures ? State.completed : State.pending,
          mutateState: signatures && !tx ? claim : undefined,
        },
      ],
      icon: 'relayer.svg',
      network: null,
    };
    const targetConfirmedHash = tx || hash;
    const targetConfirmedState = targetConfirmedHash ? State.completed : State.pending;
    const targetConfirmed: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: arrival?.name }),
      steps: [{ name: 'confirm', state: targetConfirmedState, txHash: targetConfirmedHash }],
      network: arrival,
    };

    return [transactionSend, originLocked, relayerConfirmed, targetConfirmed];
  }, [arrival, claim, departure, extrinsic_index, hash, signatures, t, tx]);

  return (
    <Record
      departure={departure}
      arrival={arrival}
      assets={[
        { amount: ring_value, unit: 'gwei', currency: departure?.isTest ? 'PRING' : 'RING' },
        { amount: kton_value, unit: 'gwei', currency: departure?.isTest ? 'PKTON' : 'KTON' },
      ]}
      recipient={target}
      blockTimestamp={block_timestamp}
      items={progresses}
    >
      <Progresses items={progresses} />
    </Record>
  );
}
