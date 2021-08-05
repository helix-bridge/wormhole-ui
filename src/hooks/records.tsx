import { useCallback, useEffect, useState } from 'react';
import { map, Subscription } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { IResponse } from '../model';

interface RecordsQueryRequest {
  url: string;
  params: Record<string, string | number>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRecords<T = any>(
  req: RecordsQueryRequest
): {
  loading: boolean;
  error: Record<string, unknown> | null;
  data: T | undefined;
  refetch: (req: RecordsQueryRequest) => Subscription;
} {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Record<string, unknown> | null>(null);
  const [data, setData] = useState<T | undefined>();
  const query = useCallback(({ url, params }: RecordsQueryRequest) => {
    setLoading(true);

    const queryStr = Object.entries(params || {})
      .filter(([_, value]) => !!value)
      .reduce((acc, cur) => {
        const pair = `${cur[0]}=${cur[1]}`;

        return acc !== '' ? `${acc}&${pair}` : pair;
      }, '');

    return ajax<IResponse<T>>({
      url: url + (queryStr ? `?${queryStr}` : ''),
      method: 'GET',
    })
      .pipe(map((res) => res.response.data))
      .subscribe({
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
