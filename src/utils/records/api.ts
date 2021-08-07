import { isNull, isUndefined } from 'lodash';
import { Observable, map } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { EResponse } from '../../model';

export interface RecordsQueryRequest {
  url: string;
  params: Record<string, string | number>;
}

export function rxGet<T>({ url, params }: RecordsQueryRequest): Observable<T | null> {
  const queryStr = Object.entries(params || {})
    .filter(([_, value]) => !isNull(value) && !isUndefined(value))
    .reduce((acc, cur) => {
      const pair = `${cur[0]}=${cur[1]}`;

      return acc !== '' ? `${acc}&${pair}` : pair;
    }, '');

  return ajax<EResponse<T>>({
    url: url + (queryStr ? `?${queryStr}` : ''),
    method: 'GET',
  }).pipe(map((res) => res.response.data || null));
}
