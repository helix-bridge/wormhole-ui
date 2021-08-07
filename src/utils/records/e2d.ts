import { catchError, EMPTY, forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiUrl } from '../helper';
import { NETWORK_CONFIG, DarwiniaApiPath } from '../../config';
import { Network, RedeemHistory, RingBurnHistory } from '../../model';
import { rxGet } from './api';

export function queryE2DRecords(
  network: Network | null,
  address: string | null
): Observable<(RingBurnHistory | RedeemHistory)[]> {
  if (network === null || address === null || address === '') {
    return EMPTY;
  }

  const api = NETWORK_CONFIG[network].api.dapp;
  const params = { address };
  const genesisObs = rxGet<(RingBurnHistory & { isGenesis: boolean })[]>({
    url: apiUrl(api, DarwiniaApiPath.ringBurn),
    params,
  }).pipe(
    map((res) => (res || []).map((item) => ({ ...item, isGenesis: true }))),
    catchError((err) => {
      console.error('%c [ genesis api request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      return [];
    })
  );
  const e2dCrossChainObs = rxGet<RedeemHistory[]>({ url: apiUrl(api, DarwiniaApiPath.redeem), params }).pipe(
    map((res) => res || []),
    catchError((err) => {
      console.error(
        '%c [ e2d cross chain api request error: ]',
        'font-size:13px; background:pink; color:#bf2c9f;',
        err
      );
      return [];
    })
  );

  return forkJoin([genesisObs, e2dCrossChainObs]).pipe(
    map(([genesisRes, e2dRes]) => [...(genesisRes || []), ...(e2dRes || [])])
  );
}
