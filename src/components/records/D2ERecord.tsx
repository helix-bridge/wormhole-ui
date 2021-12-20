import { message } from 'antd';
import BN from 'bn.js';
import { upperFirst } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY, filter, from, iif, map, Observable, of, switchMap, take, tap, zip } from 'rxjs';
import { abi, RecordComponentProps } from '../../config';
import { useTx } from '../../hooks';
import { ConnectionStatus, D2EHistory as D2ERecordType, D2EMeta, EthereumConfig } from '../../model';
import { ClaimNetworkPrefix, claimToken, connect, entrance } from '../../utils';
import { Progresses, ProgressProps, State } from './Progress';
import { Record } from './Record';

const BN_ZERO = new BN(0);

function isSufficient(config: EthereumConfig, tokenType: 'ring' | 'kton', amount: BN): Observable<boolean> {
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const store = config.contracts.e2d;
  const contract = new web3.eth.Contract(abi.tokenIssuingABI, store.redeem);
  const limit = from(contract.methods.dailyLimit(store[tokenType]).call() as Promise<string>);
  const toadySpent = from(contract.methods.spentToday(store[tokenType]).call() as Promise<string>);

  return zip([limit, toadySpent]).pipe(map(([total, spent]) => new BN(total).sub(new BN(spent)).gte(amount)));
}

// eslint-disable-next-line complexity
export function D2ERecord({ departure, arrival, record }: RecordComponentProps<D2ERecordType & { meta: D2EMeta }>) {
  const { t } = useTranslation();
  const { observer, setTx } = useTx();
  const { block_timestamp, signatures, target, ring_value, kton_value, extrinsic_index, tx } = record;
  const [hash, setHash] = useState(tx);
  const claim = useCallback(
    (monitor) => {
      const {
        signatures: sign,
        ring_value: ring,
        kton_value: kton,
        mmr_index,
        mmr_root,
        block_header,
        block_num,
        block_hash,
        meta,
      } = record;
      setTx({ status: 'sending' });
      monitor(true);

      return connect(arrival!)
        .pipe(
          filter(({ status }) => status === ConnectionStatus.success),
          take(1),
          switchMap((_) => {
            const ringBN = new BN(ring);
            const ktonBN = new BN(kton);
            const isRingSufficient = iif(
              () => ringBN.gt(BN_ZERO),
              isSufficient(arrival as EthereumConfig, 'ring', ringBN),
              of(true)
            );
            const isKtonSufficient = iif(
              () => ktonBN.gt(BN_ZERO),
              isSufficient(arrival as EthereumConfig, 'kton', ktonBN),
              of(true)
            );

            return zip(isRingSufficient, isKtonSufficient);
          }),
          tap(([isRingSuf, isKtonSuf]) => {
            if (!isRingSuf) {
              message.warn(t('{{token}} daily limit reached!', { token: 'ring' }));
            }

            if (!isKtonSuf) {
              message.warn(t('{{token}} daily limit reached!', { token: 'kton' }));
            }
          }),
          switchMap(([isRingSuf, isKtonSuf]) =>
            isRingSuf && isKtonSuf
              ? claimToken(
                  {
                    networkPrefix: upperFirst(departure?.name) as ClaimNetworkPrefix,
                    mmrIndex: mmr_index,
                    mmrRoot: mmr_root,
                    mmrSignatures: sign,
                    blockNumber: block_num,
                    blockHeaderStr: block_header,
                    blockHash: block_hash,
                    meta,
                  },
                  arrival!
                )
              : EMPTY
          )
        )
        .subscribe({
          ...observer,
          next: (state) => {
            if (state.status === 'finalized' && state.hash) {
              setHash(state.hash);
            }
            observer.next(state);
          },
          error: (err) => {
            observer.next({ status: 'error', error: err.message });
            monitor(false);
          },
          complete: () => {
            observer.complete();
            monitor(false);
          },
        });
    },
    [arrival, departure, observer, record, setTx, t]
  );

  // eslint-disable-next-line complexity
  const progresses = useMemo<ProgressProps[]>(() => {
    const transactionSend: ProgressProps = {
      title: t('{{chain}} Sent', { chain: departure?.name }),
      steps: [{ state: State.completed }],
      network: departure,
    };
    const originLocked: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: departure?.name }),
      steps: [
        {
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
          state: signatures ? State.completed : State.pending,
          mutateState: signatures && !hash ? claim : undefined,
        },
      ],
      icon: 'relayer.svg',
      network: null,
    };
    const targetConfirmedHash = hash;
    const targetConfirmedState = targetConfirmedHash ? State.completed : State.pending;
    const targetConfirmed: ProgressProps = {
      title: t('{{chain}} Confirmed', { chain: arrival?.name }),
      steps: [{ state: targetConfirmedState, txHash: targetConfirmedHash }],
      network: arrival,
    };

    return [transactionSend, originLocked, relayerConfirmed, targetConfirmed];
  }, [arrival, claim, departure, extrinsic_index, hash, signatures, t]);

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
