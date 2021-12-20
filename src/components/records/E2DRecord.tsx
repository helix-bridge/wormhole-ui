import { encodeAddress } from '@polkadot//util-crypto';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordComponentProps } from '../../config';
import { ApiKeys, EthereumConfig, Network, PolkadotConfig } from '../../model';
import { E2DHistory as E2DRecordType, RedeemHistory, RingBurnHistory } from '../../model/darwinia';
import { getLegalName, verticesToChainConfig } from '../../utils';
import { Progresses, ProgressProps, State } from './Progress';
import { Record } from './Record';

// eslint-disable-next-line complexity
export function E2DRecord({
  record,
  departure,
  arrival,
}: RecordComponentProps<
  E2DRecordType & Partial<RingBurnHistory & RedeemHistory> & { isGenesis?: boolean },
  EthereumConfig,
  PolkadotConfig<ApiKeys>
>) {
  const { chain, amount, currency, target, block_timestamp, is_relayed, tx, darwinia_tx, isGenesis } = record;
  const { t } = useTranslation();
  const decimal = arrival?.ss58Prefix ?? 0;

  // eslint-disable-next-line complexity
  const progresses = useMemo(() => {
    const from = isGenesis
      ? verticesToChainConfig({
          network: getLegalName(chain) as Network,
          mode: 'native',
        })
      : departure;
    const transactionSend: ProgressProps = {
      title: t('{{chain}} Sent', { chain: from?.name }),
      steps: [{ state: State.completed }],
      network: from,
    };

    const originLocked: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: from?.name }),
      steps: [{ state: tx ? State.completed : State.pending, txHash: tx }],
      network: from,
    };

    const relayerConfirmed: ProgressProps = {
      title: t('ChainRelay Confirmed'),
      steps: [{ state: is_relayed ? State.completed : State.pending }],
      icon: 'relayer.svg',
      network: null,
    };

    const targetConfirmed: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: arrival?.name }),
      steps: [{ state: darwinia_tx || isGenesis ? State.completed : State.pending, txHash: darwinia_tx }],
      network: arrival,
    };

    return isGenesis
      ? [transactionSend, originLocked, targetConfirmed]
      : [transactionSend, originLocked, relayerConfirmed, targetConfirmed];
  }, [arrival, chain, darwinia_tx, departure, isGenesis, is_relayed, t, tx]);

  return (
    <Record
      departure={departure}
      arrival={arrival}
      blockTimestamp={block_timestamp}
      recipient={!target || target.startsWith('0x') ? target : encodeAddress('0x' + target, decimal)}
      assets={[{ amount, deposit: JSON.parse((record as RedeemHistory).deposit || '{}'), currency }]}
      items={progresses}
    >
      <Progresses items={progresses}></Progresses>
    </Record>
  );
}
