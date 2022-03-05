import { decodeAddress } from '@polkadot/util-crypto';
import camelCaseKeys from 'camelcase-keys';
import { catchError, map, Observable, of } from 'rxjs';
import { DarwiniaApiPath } from '../../../config/api';
import { HistoryReq, ICamelCaseKeys } from '../../../model';
import { apiUrl, buf2hex, getBridge, rxGet } from '../../../utils';
import {
  Darwinia2EthereumHistoryRes,
  Darwinia2EthereumRecord,
  Ethereum2DarwiniaRedeemHistoryRes,
  Ethereum2DarwiniaRedeemRecord,
  Ethereum2DarwiniaRingBurnHistoryRes,
  Ethereum2DarwiniaRingBurnRecord,
  EthereumDarwiniaBridgeConfig,
} from '../model';

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

/**
 * @description darwinia -> ethereum
 */
export function queryDarwinia2EthereumIssuingRecords({
  address,
  confirmed,
  direction,
  paginator,
}: HistoryReq): Observable<Darwinia2EthereumHistoryRes<ICamelCaseKeys<Darwinia2EthereumRecord>> | null> {
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<Darwinia2EthereumHistoryRes>({
    url: apiUrl(api, DarwiniaApiPath.locks),
    params: { address: buf2hex(decodeAddress(address).buffer), confirmed, ...paginator },
  }).pipe(
    map((res) => {
      if (!res) {
        return res;
      }
      const { list, ...rest } = res;

      return { ...rest, list: list.map((item) => camelCaseKeys(item)) };
    }),
    catchError((err) => {
      console.error('%c [ d2e records request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      return of(null);
    })
  );
}
