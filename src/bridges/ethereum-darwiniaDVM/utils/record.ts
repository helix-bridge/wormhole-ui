import { catchError, map, Observable, of } from 'rxjs';
import camelCaseKeys from 'camelcase-keys';
import { DarwiniaApiPath } from '../../../config/api';
import { HistoryReq, ICamelCaseKeys } from '../../../model';
import { apiUrl, getBridge, rxGet } from '../../../utils';
import { EthereumDVMBridgeConfig } from '../model';
import {
  Darwinia2EthereumHistoryRes,
  Darwinia2EthereumRecord,
  Ethereum2DarwiniaRedeemHistoryRes,
  Ethereum2DarwiniaRedeemRecord,
} from '../../ethereum-darwinia/model';

export function queryDarwiniaDVM2EthereumIssuingRecords({
  address,
  confirmed,
  direction,
  paginator,
}: HistoryReq): Observable<Darwinia2EthereumHistoryRes<ICamelCaseKeys<Darwinia2EthereumRecord>> | null> {
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

  return rxGet<Darwinia2EthereumHistoryRes<ICamelCaseKeys<Darwinia2EthereumRecord>>>({
    url: apiUrl(api, DarwiniaApiPath.issuingBurns),
    params: { sender: address, confirmed, ...paginator },
  }).pipe(
    catchError((err) => {
      console.error('%c [ dvm2e records request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      return of(null);
    })
  );
}

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
