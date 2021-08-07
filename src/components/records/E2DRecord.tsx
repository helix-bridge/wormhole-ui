import { encodeAddress } from '@polkadot//util-crypto';
import { RecordComponentProps } from '../../config';
import { Network } from '../../model';
import { E2DHistory as E2DRecordType, RedeemHistory, RingBurnHistory } from '../../model/darwinia';
import { getLegalName } from '../../utils';
import { ProgressDetail, CrosseState } from './ProgressDetail';
import { Record, RecordProps } from './Record';

// eslint-disable-next-line complexity
export function E2DRecord({
  record,
  network,
}: RecordComponentProps<E2DRecordType & Partial<RingBurnHistory & RedeemHistory> & { isGenesis?: boolean }>) {
  const { chain, amount, currency, target, block_timestamp, is_relayed, tx, darwinia_tx, isGenesis } = record;
  const decimal = network?.ss58Prefix ?? 0;

  let step = CrosseState.takeOff;

  if (isGenesis) {
    step = CrosseState.claimed;
  } else {
    if (is_relayed) {
      step = CrosseState.relayed;
    }

    if (is_relayed && darwinia_tx !== '') {
      step = CrosseState.claimed;
    }
  }

  const data: RecordProps = {
    blockTimestamp: block_timestamp,
    recipient: target.startsWith('0x') ? target : encodeAddress('0x' + target, decimal),
    assets: [{ amount, deposit: JSON.parse((record as RedeemHistory).deposit || '{}'), currency }],
    step,
    hasRelay: !!is_relayed,
    from: {
      network: network?.name || (getLegalName(chain) as Network),
      txHash: tx,
    },
    to: {
      network: network?.name === 'ethereum' ? 'darwinia' : 'pangolin',
      txHash: darwinia_tx,
    },
  };

  return (
    <Record {...data}>
      <ProgressDetail {...data}></ProgressDetail>
    </Record>
  );
}
