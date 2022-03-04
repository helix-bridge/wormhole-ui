import { catchError, Observable, of } from 'rxjs';
import camelCaseKeys from 'camelcase-keys';
import { map } from 'rxjs/operators';
import { getBridge } from '../bridge';
import { DarwiniaApiPath } from '../../config/api';
import {
  EthereumDarwiniaBridgeConfig,
  EthereumDVMBridgeConfig,
  HistoryReq,
  Ethereum2DarwiniaRedeemHistoryRes,
  Ethereum2DarwiniaRingBurnHistoryRes,
  ICamelCaseKeys,
  Ethereum2DarwiniaRingBurnRecord,
  Ethereum2DarwiniaRedeemRecord,
} from '../../model';
import { apiUrl, rxGet } from '../helper';

/* -------------------------------------------E2D---------------------------------------------- */

/**
 * @description darwinia <- ethereum
 */
export function queryEthereum2DarwiniaRedeemRecords({
  address,
  confirmed,
  direction,
  paginator,
}: HistoryReq): Observable<Ethereum2DarwiniaRedeemHistoryRes<ICamelCaseKeys<Ethereum2DarwiniaRedeemRecord>> | null> {
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<Ethereum2DarwiniaRedeemHistoryRes>({
    url: apiUrl(api, DarwiniaApiPath.redeem),
    params: { address, confirmed, ...paginator },
  }).pipe(
    map((res) => ({ count: res?.count ?? 0, list: (res?.list ?? []).map((item) => camelCaseKeys(item)) })),
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
}: HistoryReq): Observable<Ethereum2DarwiniaRingBurnHistoryRes<
  ICamelCaseKeys<Ethereum2DarwiniaRingBurnRecord>
> | null> {
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<Ethereum2DarwiniaRingBurnHistoryRes & { isGenesis: boolean }>({
    url: apiUrl(api, DarwiniaApiPath.ringBurn),
    params: { address, confirmed, ...paginator },
  }).pipe(
    map((res) => ({
      count: res?.count ?? 0,
      list: (res?.list ?? []).map((item) => camelCaseKeys({ ...item, isGenesis: true })),
    })),
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
}: HistoryReq): Observable<Ethereum2DarwiniaRedeemHistoryRes<ICamelCaseKeys<Ethereum2DarwiniaRedeemRecord>> | null> {
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<Ethereum2DarwiniaRedeemHistoryRes<ICamelCaseKeys<Ethereum2DarwiniaRedeemRecord>>>({
    url: apiUrl(api, DarwiniaApiPath.tokenLock),
    params: { sender: address, ...paginator, confirmed },
  }).pipe(
    map((res) => ({ count: res?.count ?? 0, list: (res?.list ?? []).map((item) => camelCaseKeys(item)) })),
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
