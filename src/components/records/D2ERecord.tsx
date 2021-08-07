import { RecordComponentProps } from '../../config';
import { useTx } from '../../hooks';
import { D2EHistory as D2ERecordType, D2EMeta } from '../../model';
import { ClaimNetworkPrefix, claimToken, toUpperCaseFirst } from '../../utils';
import { ProgressDetail, CrosseState } from './ProgressDetail';
import { Record, RecordProps } from './Record';

// eslint-disable-next-line complexity
export function D2ERecord({ network, record }: RecordComponentProps<D2ERecordType & { meta: D2EMeta }>) {
  const { observer } = useTx();
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
  let step = CrosseState.takeOff;

  if (signatures) {
    step = CrosseState.relayed;
  }

  if (signatures && tx !== '') {
    step = CrosseState.claimed;
  }

  const data: RecordProps = {
    from: { network: network?.name || 'darwinia', txHash: extrinsic_index },
    to: { network: network?.name === 'darwinia' ? 'ethereum' : 'ropsten', txHash: tx },
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
        claim={() => {
          claimToken({
            networkPrefix: toUpperCaseFirst(data.from.network) as ClaimNetworkPrefix,
            mmrIndex: mmr_index,
            mmrRoot: mmr_root,
            mmrSignatures: signatures,
            blockNumber: block_num,
            blockHeaderStr: block_header,
            blockHash: block_hash,
            meta,
          }).subscribe(observer);
        }}
      />
    </Record>
  );
}
