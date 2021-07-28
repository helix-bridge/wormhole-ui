import { AxiosRequestConfig, AxiosError, AxiosPromise } from 'axios';
import useAxios, { Options, RefetchOptions } from 'axios-hooks';
import { IResponse } from '../model';

export function useIAxios<T>(
  config: AxiosRequestConfig | string,
  options?: Options
): {
  data: T | null;
  loading: boolean;
  error?: AxiosError<unknown>;
  refetch: (config?: AxiosRequestConfig, options?: RefetchOptions) => AxiosPromise<IResponse<T>>;
} {
  const [{ data, loading, error }, refetch] = useAxios<IResponse<T>>(config, options);

  return {
    data: data?.data ?? null,
    loading,
    error,
    refetch,
  };
}
