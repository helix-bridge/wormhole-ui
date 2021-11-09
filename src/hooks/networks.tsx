import { chain } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { AIRDROP_GRAPH, AIRPORTS, NETWORKS } from '../config';
import { Arrival, Departure, ChainConfig, NetworkFilter } from '../model';
import { useApi } from './api';

const omitTestChain: NetworkFilter = (net) => !net.isTest;

const getGlobalFilters = (isTestDisplay: boolean) => (isTestDisplay ? [] : [omitTestChain]);

const departureFilterCreator: (source: Map<Departure, Arrival[]>) => NetworkFilter = (source) => {
  const departures = [...source.keys()].map((item) => item.network);
  return (config) => departures.includes(config.name);
};

const arrivalFilterCreator: (source: Map<Departure, Arrival[]>) => NetworkFilter = (source) => {
  const arrivals = chain([...source.values()])
    .flatten()
    .map((item) => item.network)
    .uniq()
    .value();

  return (config) => arrivals.includes(config.name);
};

export const airportsDepartureFilter = departureFilterCreator(AIRDROP_GRAPH);
export const airportsArrivalFilter = arrivalFilterCreator(AIRDROP_GRAPH);

export function useNetworks(isCross: boolean) {
  const { enableTestNetworks } = useApi();
  const [fromFilters, setFromFilters] = useState<NetworkFilter[]>([]);
  const [fromNetworks, setFromNetworks] = useState<ChainConfig[]>(NETWORKS);
  const [toFilters, setToFilters] = useState<NetworkFilter[]>([]);
  const [toNetworks, setToNetworks] = useState<ChainConfig[]>(NETWORKS);
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
