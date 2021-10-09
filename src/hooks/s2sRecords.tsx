import { message } from 'antd';
import { getUnixTime } from 'date-fns';
import { GraphQLClient, useManualQuery } from 'graphql-hooks';
import { isBoolean, uniqBy } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { catchError, forkJoin, from, map, Observable, of } from 'rxjs';
import {
  S2S_ISSUING_CONFIRMED_RECORDS_QUERY,
  S2S_ISSUING_LOCKED_RECORDS_QUERY,
  S2S_REDEEM_RECORDS_QUERY,
} from '../config';
import { BurnRecord, BurnRecordsRes, HistoryReq, NetConfig, TokenLockRes } from '../model';
import { getNetworkMode } from '../utils';

enum S2SRecordResult {
  locked,
  lockConfirmedSuccess,
  lockConfirmedFail,
}

export function useS2SRecords(
  departure: NetConfig
): (req: HistoryReq) => Observable<{ count: number; list: BurnRecord[] }> {
  const issuingClient = useMemo(() => new GraphQLClient({ url: departure.api.subql }), [departure.api.subql]);
  const redeemClient = useMemo(
    () =>
      new GraphQLClient({
        url:
          departure.api.subGraph ||
          'http://t1.pangolin-p2p.darwinia.network:8000/subgraphs/name/wormhole/DarwiniaMappingTokenFactory',
      }),
    [departure.api.subGraph]
  );
  const { t } = useTranslation();
  // s2s issuing
  const [fetchTokenLockRecords] = useManualQuery<TokenLockRes>(S2S_ISSUING_LOCKED_RECORDS_QUERY, {
    skipCache: true,
    client: issuingClient,
  });
  const [fetchConfirmedRecords] = useManualQuery<TokenLockRes>(S2S_ISSUING_CONFIRMED_RECORDS_QUERY, {
    skipCache: true,
    client: issuingClient,
  });
  // s2s redeem, departure pangolin-smart
  const [fetchBurnRecords] = useManualQuery<BurnRecordsRes>(S2S_REDEEM_RECORDS_QUERY, {
    skipCache: true,
    client: redeemClient,
  });

  const fetchS2SIssuingRecords = useCallback(
    (req: HistoryReq) => {
      const {
        address: account,
        paginator: { row: limit, page: offset },
        confirmed,
      } = req;
      const resultList = isBoolean(confirmed)
        ? confirmed
          ? [S2SRecordResult.lockConfirmedSuccess, S2SRecordResult.lockConfirmedFail]
          : [S2SRecordResult.locked]
        : [S2SRecordResult.locked, S2SRecordResult.lockConfirmedSuccess, S2SRecordResult.lockConfirmedFail];
      const lockedRecords = from(fetchTokenLockRecords({ variables: { account, limit, offset } })).pipe(
        map((res) => {
          const { nodes = [] } = res.data?.transfers ?? {};
          const result = nodes.map((item) => {
            const { data, timestamp, extrinsic } = item.block.events.nodes[0] || {};
            const [messageId, { native }, sender, recipient, amount] = JSON.parse(data) as [
              string,
              { native: { address: string; value: number; option: null } },
              string,
              string,
              number
            ];

            return {
              message_id: messageId,
              transaction: extrinsic.id,
              sender,
              recipient,
              amount: amount.toString(),
              token: native.address,
              start_timestamp: getUnixTime(new Date(timestamp)).toString(),
              result: S2SRecordResult.locked,
              end_timestamp: '',
            } as BurnRecord;
          });

          return uniqBy(result, (item) => item.message_id); // FIXME: why duplicated?
        }),
        catchError(() => of([]))
      );
      const confirmedRecords = from(fetchConfirmedRecords({ variables: { account, limit, offset } })).pipe(
        map((res) => {
          const { nodes = [] } = res.data?.transfers ?? {};

          return nodes.map((item) => {
            const { data, timestamp } = item.block.events.nodes[0] || {};
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars,
            const [messageId, _1, _2, result] = JSON.parse(data) as [
              string,
              { native: { address: string; value: number; option: null } },
              string,
              boolean
            ];

            return {
              messageId,
              result: result ? S2SRecordResult.lockConfirmedSuccess : S2SRecordResult.lockConfirmedFail,
              end_timestamp: getUnixTime(new Date(timestamp)).toString(),
            };
          });
        }),
        catchError(() => of([]))
      );

      return forkJoin([lockedRecords, confirmedRecords]).pipe(
        map(([locked, completed]) => {
          const list = locked
            .map((item) => {
              const exist = completed.find((rec) => rec.messageId === item.message_id);

              return exist ? { ...item, ...exist } : item;
            })
            .filter((item) => resultList.includes(item.result)) as BurnRecord[];

          return { count: list.length, list };
        })
      );
    },
    [fetchConfirmedRecords, fetchTokenLockRecords]
  );

  const fetchS2SRedeemRecords = useCallback(
    (req: HistoryReq) => {
      const {
        address: account,
        paginator: { row: limit, page: offset },
        confirmed,
      } = req;
      const result = isBoolean(confirmed)
        ? confirmed
          ? [S2SRecordResult.lockConfirmedSuccess, S2SRecordResult.lockConfirmedFail]
          : [S2SRecordResult.locked]
        : [S2SRecordResult.locked, S2SRecordResult.lockConfirmedSuccess, S2SRecordResult.lockConfirmedFail];

      return from(fetchBurnRecords({ variables: { account, offset, limit, result } })).pipe(
        map((res) => {
          const list = res.data?.burnRecordEntities ?? [];

          return { count: list.length, list };
        }),
        catchError(() => {
          message.error(t('Querying failed, please try it again later'));
          return of({ count: 0, list: [] });
        })
      );
    },
    [fetchBurnRecords, t]
  );

  return getNetworkMode(departure) === 'dvm' ? fetchS2SRedeemRecords : fetchS2SIssuingRecords;
}
