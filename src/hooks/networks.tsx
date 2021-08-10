import { useCallback, useEffect, useState } from 'react';
import { AIRPORTS, NETWORKS } from '../config';
import { NetConfig, NetworkFilter } from '../model';
import { useApi } from './api';

export enum Direction {
  from = 'from',
  to = 'to',
}

const omitTestChain: NetworkFilter = (net) => !net.isTest;

const getGlobalFilters = (isTestDisplay: boolean) => (isTestDisplay ? [] : [omitTestChain]);

export function useNetworks(isCross: boolean) {
  const { enableTestNetworks } = useApi();
  const [fromFilters, setFromFilters] = useState<NetworkFilter[]>([]);
  const [fromNetworks, setFromNetworks] = useState<NetConfig[]>([]);
  const [toFilters, setToFilters] = useState<NetworkFilter[]>([]);
  const [toNetworks, setToNetworks] = useState<NetConfig[]>([]);
  const getNetworks = useCallback(
    (filters: NetworkFilter[]) => {
      return [...getGlobalFilters(enableTestNetworks), ...filters].reduce(
        (networks, predicateFn) => networks.filter((network) => predicateFn(network)),
        isCross ? NETWORKS : AIRPORTS
      );
    },
    [enableTestNetworks, isCross]
  );

  useEffect(() => {
    const from = getNetworks(fromFilters);

    setFromNetworks(from);
  }, [fromFilters, getNetworks]);

  useEffect(() => {
    const to = getNetworks(toFilters);

    setToNetworks(to);
  }, [getNetworks, toFilters]);

  return {
    fromNetworks,
    toNetworks,
    setFromFilters,
    setToFilters,
  };
}
