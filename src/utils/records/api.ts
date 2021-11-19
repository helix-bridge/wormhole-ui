import { isNull, isUndefined } from 'lodash';
import { last, map, MonoTypeOperatorFunction, Observable, scan, switchMapTo, takeWhile, tap, timer } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { EResponse } from '../../model';

export interface RecordsQueryRequest {
  url: string;
  params: Record<string, string | number | boolean | undefined | null>;
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

function attemptsGuardFactory(maxAttempts: number) {
  return (attemptsCount: number) => {
    if (attemptsCount > maxAttempts) {
      throw new Error(`Exceeded maxAttempts: ${maxAttempts}, actual attempts: ${attemptsCount}`);
    }
  };
}

/**
 * @function pollWhile - Custom rxjs operator
 * @params  maxAttempts - polling will be canceled when attempts count reached even there is no result.
 * @params  emitOnlyLast - omit the values before the result
 * @description polling until there is a result
 */
export function pollWhile<T>(
  pollInterval: number,
  isPollingActive: (res: T) => boolean,
  maxAttempts = Infinity,
  emitOnlyLast = false
): MonoTypeOperatorFunction<T> {
  return (source$) => {
    const poll$ = timer(0, pollInterval).pipe(
      scan((attempts) => ++attempts, 0),
      tap(attemptsGuardFactory(maxAttempts)),
      switchMapTo(source$),
      takeWhile(isPollingActive, true)
    );

    return emitOnlyLast ? poll$.pipe(last()) : poll$;
  };
}
