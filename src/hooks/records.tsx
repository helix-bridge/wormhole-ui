import { isNull, omitBy } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { useSubstrate2DVMRecords } from '../bridges/substrate-dvm/hooks';
import { useS2SRecords } from '../bridges/substrate-substrateDVM/hooks';
import { Departure, HistoryReq } from '../model';
import {
  isDarwinia2Ethereum,
  isDVM2Ethereum,
  isDVM2Substrate,
  isEthereum2Darwinia,
  isEthereum2DVM,
  isSubstrate2DVM,
  isSubstrate2SubstrateDVM,
  isSubstrateDVM2Substrate,
  isTronNetwork,
  queryDarwinia2EthereumIssuingRecords,
  queryDarwiniaDVM2EthereumIssuingRecords,
  queryEthereum2DarwiniaDVMRedeemRecords,
  queryEthereum2DarwiniaGenesisRecords,
  queryEthereum2DarwiniaRedeemRecords,
  RecordsQueryRequest,
  rxGet,
  verticesToChainConfig,
} from '../utils';

interface RecordsHook<T> {
  loading: boolean;
  error?: Record<string, unknown> | null;
  data: T | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch?: (...args: any) => Subscription;
}

export function useRecordsQuery<T = unknown>(req: RecordsQueryRequest): RecordsHook<T> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Record<string, unknown> | null>(null);
  const [data, setData] = useState<T | null>(null);
  const query = useCallback((request: RecordsQueryRequest) => {
    setLoading(true);

    return rxGet<T>(request).subscribe({
      next: (res) => {
        setData(res);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
      complete: () => {
        setLoading(false);
      },
    });
  }, []);

  useEffect(() => {
    const sub$$ = query(req);
    return () => {
      sub$$.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    data,
    error,
    refetch: query,
  };
}

export function useRecords(departure: Departure, arrival: Departure) {
  const { fetchS2SIssuingRecords, fetchS2SRedeemRecords } = useS2SRecords(
    verticesToChainConfig(departure),
    verticesToChainConfig(arrival)
  );

  const genParams = useCallback((params: HistoryReq) => {
    const req = omitBy<HistoryReq>(params, isNull) as HistoryReq;
    const [dep] = params.direction;

    if (isTronNetwork(dep.network)) {
      return { ...req, address: window.tronWeb ? window.tronWeb.address.toHex(params.address) : '' };
    }

    return req;
  }, []);

  const { fetchDVM2SubstrateRecords, fetchSubstrate2DVMRecords } = useSubstrate2DVMRecords(
    verticesToChainConfig(departure),
    verticesToChainConfig(arrival)
  );

  const genQueryFn = useCallback<(isGenesis: boolean) => (req: HistoryReq) => Observable<unknown>>(
    // eslint-disable-next-line complexity
    (isGenesis = false) => {
      if (isTronNetwork(departure.network) || (isEthereum2Darwinia(departure, arrival) && isGenesis)) {
        return queryEthereum2DarwiniaGenesisRecords;
      }

      if (isEthereum2Darwinia(departure, arrival) && !isGenesis) {
        return queryEthereum2DarwiniaRedeemRecords;
      }

      if (isDarwinia2Ethereum(departure, arrival)) {
        return queryDarwinia2EthereumIssuingRecords;
      }

      if (isSubstrate2SubstrateDVM(departure, arrival)) {
        return fetchS2SIssuingRecords;
      }

      if (isSubstrateDVM2Substrate(departure, arrival)) {
        return fetchS2SRedeemRecords;
      }

      if (isEthereum2DVM(departure, arrival)) {
        return queryEthereum2DarwiniaDVMRedeemRecords;
      }

      if (isDVM2Ethereum(departure, arrival)) {
        return queryDarwiniaDVM2EthereumIssuingRecords;
      }

      if (isSubstrate2DVM(departure, arrival)) {
        return fetchSubstrate2DVMRecords;
      }

      if (isDVM2Substrate(departure, arrival)) {
        return fetchDVM2SubstrateRecords;
      }

      return (_: HistoryReq) => EMPTY;
    },
    [
      departure,
      arrival,
      fetchS2SIssuingRecords,
      fetchS2SRedeemRecords,
      fetchSubstrate2DVMRecords,
      fetchDVM2SubstrateRecords,
    ]
  );

  const queryRecords = useCallback(
    (params: HistoryReq, isGenesis: boolean) => {
      const { direction, address } = params;

      if (!direction || !address) {
        return EMPTY;
      }

      const req = genParams(params);
      const fn = genQueryFn(isGenesis);

      return fn(req);
    },
    [genParams, genQueryFn]
  );

  return { queryRecords };
}
