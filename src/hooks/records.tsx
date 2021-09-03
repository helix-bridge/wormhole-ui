import { useCallback, useEffect, useState } from 'react';
import { catchError, forkJoin, Subscription } from 'rxjs';
import { DarwiniaApiPath, NETWORK_CONFIG } from '../config';
import { D2EHistoryRes, Network, Paginator, RedeemHistory, RingBurnHistory } from '../model';
import { apiUrl, RecordsQueryRequest, rxGet } from '../utils';

interface RecordsHook<T> {
  loading: boolean;
  error?: Record<string, unknown> | null;
  data: T | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch?: (...args: any) => Subscription;
}

export function useGet<T = unknown>(req: RecordsQueryRequest): RecordsHook<T> {
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

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
function useEthereumRecords(
  net: Network | null,
  addr: string | null
): RecordsHook<(RingBurnHistory | RedeemHistory)[]> {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<(RingBurnHistory | RedeemHistory)[]>([]);
  const request = useCallback((network: Network, address: string) => {
    setLoading(true);

    const api = NETWORK_CONFIG[network].api.dapp;
    const params = { address };
    const genesisObs = rxGet<RingBurnHistory[]>({ url: apiUrl(api, DarwiniaApiPath.ringBurn), params }).pipe(
      catchError((err) => {
        console.error('%c [ genesis api request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
        return [];
      })
    );
    const e2dCrossChainObs = rxGet<RedeemHistory[]>({ url: apiUrl(api, DarwiniaApiPath.redeem), params }).pipe(
      catchError((err) => {
        console.error(
          '%c [ e2d cross chain api request error: ]',
          'font-size:13px; background:pink; color:#bf2c9f;',
          err
        );
        return [];
      })
    );

    return forkJoin([genesisObs, e2dCrossChainObs]).subscribe(([genesisRes, e2dRes]) => {
      setData([...(genesisRes || []), ...(e2dRes || [])]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!net || !addr) {
      return;
    }

    const sub$$ = request(net, addr);

    return () => {
      sub$$.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net, addr]);

  return { loading, data, refetch: request };
}

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
function useDarwiniaRecords(
  net: Network | null,
  addr: string | null /* ss58 address should be transfer to public key */,
  pagination: Paginator = { row: 100, page: 0 }
): RecordsHook<D2EHistoryRes> {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<D2EHistoryRes | null>(null);
  const request = useCallback((network: Network, address: string, paginator?: Paginator) => {
    setLoading(true);

    const api = NETWORK_CONFIG[network].api.dapp;
    const params = { address, ...(paginator ?? { row: 100, page: 0 }) };
    const locksObs = rxGet<D2EHistoryRes>({ url: apiUrl(api, DarwiniaApiPath.locks), params }).pipe(
      catchError((err) => {
        console.error('%c [ d2e records request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
        return [];
      })
    );

    return locksObs.subscribe((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!net || !addr) {
      return;
    }

    const sub$$ = request(net, addr, pagination);

    return () => {
      sub$$.unsubscribe();
    };
  }, [net, addr, pagination, request]);

  return { loading, data, refetch: request };
}
