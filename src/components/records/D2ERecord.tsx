import { upperFirst } from 'lodash';
import { useState } from 'react';
import { RecordComponentProps } from '../../config';
import { useTx } from '../../hooks';
import { D2EHistory as D2ERecordType, D2EMeta } from '../../model';
import { ClaimNetworkPrefix, claimToken } from '../../utils';
import { CrosseState, ProgressDetail } from './ProgressDetail';
import { Record, RecordProps } from './Record';

// eslint-disable-next-line complexity
export function D2ERecord({ departure, arrival, record }: RecordComponentProps<D2ERecordType & { meta: D2EMeta }>) {
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
  const [step, setStep] = useState(() => {
    let state = CrosseState.takeOff;

    if (signatures) {
      state = CrosseState.relayed;
    }

    if (signatures && tx !== '') {
      state = CrosseState.claimed;
    }

    return state;
  });
  const [hash, setHash] = useState('');

  const data: RecordProps = {
    from: { network: departure?.name || 'darwinia', txHash: extrinsic_index },
    to: { network: arrival?.name || 'ethereum', txHash: tx || hash },
    assets: [
      { amount: ring_value, unit: 'gwei', currency: 'RING' },
      { amount: kton_value, unit: 'gwei', currency: 'KTON' },
    ],
    step,
    recipient: target,
    blockTimestamp: block_timestamp,
    hasRelay: true,
  };

  return (
    <Record {...data}>
      <ProgressDetail
        {...data}
        claim={
          !hash && !tx
            ? () => {
                setTx({ status: 'queued' });
                claimToken({
                  networkPrefix: upperFirst(data.from.network) as ClaimNetworkPrefix,
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
                      setStep(CrosseState.claimed);
                      setHash(hash);
                    }
                    observer.next(state);
                  },
                });
              }
            : undefined
        }
      />
    </Record>
  );
}
