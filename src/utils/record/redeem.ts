import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { getBridge } from '..';
import { DarwiniaApiPath } from '../../config';
import {
  EthereumDarwiniaBridgeConfig,
  EthereumDVMBridgeConfig,
  HistoryReq,
  RedeemHistoryRes,
  RingBurnHistoryRes,
} from '../../model';
import { apiUrl } from '../helper';
import { rxGet } from './api';

/* -------------------------------------------E2D---------------------------------------------- */

/**
 * @description darwinia <- ethereum
 */
export function queryEthereum2DarwiniaRedeemRecords({
  address,
  confirmed,
  direction,
  paginator,
}: HistoryReq): Observable<RedeemHistoryRes | null> {
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<RedeemHistoryRes>({
    url: apiUrl(api, DarwiniaApiPath.redeem),
    params: { address, confirmed, ...paginator },
  }).pipe(
    catchError((err) => {
      console.error(
        '%c [ e2d cross chain api request error: ]',
        'font-size:13px; background:pink; color:#bf2c9f;',
        err
      );
      return of(null);
    })
  );
}

/**
 * @description darwinia <- ethereum
 */
export function queryEthereum2DarwiniaGenesisRecords({
  address,
  confirmed,
  direction,
  paginator,
}: HistoryReq): Observable<RingBurnHistoryRes | null> {
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<RingBurnHistoryRes & { isGenesis: boolean }>({
    url: apiUrl(api, DarwiniaApiPath.ringBurn),
    params: { address, confirmed, ...paginator },
  }).pipe(
    map((res) => {
      const { count, list } = res!;

      return {
        count,
        list: (list || []).map((item) => ({ ...item, isGenesis: true })),
      };
    }),
    catchError((err) => {
      console.error('%c [ genesis api request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      return of(null);
    })
  );
}

/* -------------------------------------------E2DVM---------------------------------------------- */

/**
 * @description darwinia DVM <- ethereum
 */
export function queryEthereum2DarwiniaDVMRedeemRecords({
  address,
  confirmed,
  direction,
  paginator,
}: HistoryReq): Observable<RedeemHistoryRes | null> {
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<RedeemHistoryRes>({
    url: apiUrl(api, DarwiniaApiPath.tokenLock),
    params: { sender: address, ...paginator, confirmed },
  }).pipe(
    catchError((err) => {
      console.error(
        '%c [ e2dvm cross chain api request error: ]',
        'font-size:13px; background:pink; color:#bf2c9f;',
        err
      );
      return of(null);
    })
  );
}
