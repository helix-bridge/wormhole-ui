import { getUnixTime } from 'date-fns';
import { upperCase } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DVMChainConfig, PolkadotChainConfig, RecordComponentProps, Substrate2DVMRecord } from '../../../model';
import { convertToSS58, isDVM } from '../../../utils';
import { Progresses, ProgressProps, State } from '../Progress';
import { Record } from '../Record';

export function SubstrateDVMRecord({
  departure,
  arrival,
  record,
}: RecordComponentProps<Substrate2DVMRecord, PolkadotChainConfig, PolkadotChainConfig>) {
  const { t } = useTranslation();

  const symbol = useMemo(() => {
    if (!departure) {
      return '';
    }

    return record.tokenId === 'balances'
      ? (departure as DVMChainConfig).ethereumChain.nativeCurrency.symbol!
      : upperCase(`${departure.name.charAt(0)}kton`);
  }, [departure, record]);

  const chainName = useCallback(
    (config: PolkadotChainConfig) => (isDVM(config) ? `${config?.name} (Smart) ` : config.name),
    []
  );

  const transactionSend = useMemo(
    () => ({
      title: t('{{chain}} Sent', { chain: chainName(departure!) }),
      steps: [{ state: State.completed }],
      network: departure,
    }),
    [chainName, departure, t]
  );

  const originLocked = useMemo(
    () => ({
      title: t('{{chain}} Locked', { chain: chainName(departure!) }),
      steps: [{ state: State.completed }],
      network: departure,
      icon: 'lock.svg',
    }),
    [chainName, departure, t]
  );

  const targetConfirmed = useMemo<ProgressProps>(() => {
    return {
      title: t('{{chain}} Confirmed', { chain: chainName(arrival!) }),
      steps: [{ state: State.completed, blockHash: record.block?.blockHash }],
      network: arrival,
    };
  }, [arrival, chainName, record.block?.blockHash, t]);

  const progresses = [transactionSend, originLocked, targetConfirmed];

  return (
    <Record
      departure={departure}
      arrival={arrival}
      blockTimestamp={getUnixTime(new Date(record.timestamp)) || Date.now()}
      recipient={isDVM(departure!) ? convertToSS58(record.toId, arrival?.ss58Prefix ?? null) : record.fromId}
      assets={[{ amount: record.amount, currency: symbol, unit: 'gwei' }]}
      items={progresses}
    >
      <Progresses items={progresses} />
    </Record>
  );
}
