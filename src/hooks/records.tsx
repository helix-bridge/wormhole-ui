import { useCallback, useEffect, useState } from 'react';
import { catchError, forkJoin, map, Observable, Subscription } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { DarwiniaApiPath, NETWORK_CONFIG } from '../config';
import { EResponse, Network } from '../model';
import { RedeemRecord, RingBurnRecord } from '../model/darwinia';
import { apiUrl } from '../utils';

interface RecordsQueryRequest {
  url: string;
  params: Record<string, string | number>;
}

interface RecordsHook<T> {
  loading: boolean;
  error?: Record<string, unknown> | null;
  data: T | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch?: (...args: any) => Subscription;
}

function rxGet<T>({ url, params }: RecordsQueryRequest): Observable<T | null> {
  const queryStr = Object.entries(params || {})
    .filter(([_, value]) => !!value)
    .reduce((acc, cur) => {
      const pair = `${cur[0]}=${cur[1]}`;

      return acc !== '' ? `${acc}&${pair}` : pair;
    }, '');

  return ajax<EResponse<T>>({
    url: url + (queryStr ? `?${queryStr}` : ''),
    method: 'GET',
  }).pipe(map((res) => res.response.data || null));
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

export function useEthereumRecords(
  net: Network | null,
  addr: string | null
): RecordsHook<(RingBurnRecord | RedeemRecord)[]> {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<(RingBurnRecord | RedeemRecord)[]>([]);
  const request = useCallback((network: Network, address: string) => {
    setLoading(true);

    const api = NETWORK_CONFIG[network].api.dapp;
    const params = { address };
    const genesisObs = rxGet<RingBurnRecord[]>({ url: apiUrl(api, DarwiniaApiPath.ringBurn), params }).pipe(
      catchError((err) => {
        console.error('%c [ genesis api request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
        return [];
      })
    );
    const e2dCrossChainObs = rxGet<RedeemRecord[]>({ url: apiUrl(api, DarwiniaApiPath.redeem), params }).pipe(
      catchError((err) => {
        console.error(
          '%c [ e2d cross chain api request error: ]',
          'font-size:13px; background:pink; color:#bf2c9f;',
          err
        );
        return [];
      })
    );
    // const erc20Obs = rxGet({
    //   url: apiUrl(api, DarwiniaApiPath.tokenLock),
    //   params: { sender: address, row: 1, page: 1 },
    // });

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
  }, [net, addr, request]);

  return { loading, data, refetch: request };
}
