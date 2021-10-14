import { message } from 'antd';
import { getUnixTime } from 'date-fns';
import { GraphQLClient, useManualQuery } from 'graphql-hooks';
import { isBoolean } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { catchError, from, map, Observable, of } from 'rxjs';
import { S2S_ISSUING_RECORDS_QUERY, S2S_REDEEM_RECORDS_QUERY } from '../config';
import { HistoryReq, NetConfig, S2SBurnRecordsRes, S2SHistoryRecord, S2SLockedRecordRes } from '../model';
import { getNetworkMode } from '../utils';

enum S2SRecordResult {
  locked,
  lockConfirmedSuccess,
  lockConfirmedFail,
}

const REDEEM_DEFAULT = 'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/DarwiniaMappingTokenFactory';
const ISSUING_DEFAULT = 'https://api.subquery.network/sq/darwinia-network/pangolin';

export function useS2SRecords(
  departure: NetConfig
): (req: HistoryReq) => Observable<{ count: number; list: S2SHistoryRecord[] }> {
  const issuingClient = useMemo(
    () => new GraphQLClient({ url: departure.api.subql || ISSUING_DEFAULT }),
    [departure.api.subql]
  );
  const redeemClient = useMemo(
    () => new GraphQLClient({ url: departure.api.subGraph || REDEEM_DEFAULT }),
    [departure.api.subGraph]
  );
  const { t } = useTranslation();
  // s2s issuing
  const [fetchLockedRecords] = useManualQuery<S2SLockedRecordRes>(S2S_ISSUING_RECORDS_QUERY, {
    skipCache: true,
    client: issuingClient,
  });
  // s2s redeem, departure pangolin-smart
  const [fetchBurnRecords] = useManualQuery<S2SBurnRecordsRes>(S2S_REDEEM_RECORDS_QUERY, {
    skipCache: true,
    client: redeemClient,
  });

  const toQueryVariables = useCallback((req: HistoryReq) => {
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

    return { account, limit, offset, result };
  }, []);

  const fetchS2SIssuingRecords = useCallback(
    (req: HistoryReq) =>
      from(
        fetchLockedRecords({
          variables: toQueryVariables(req),
        })
      ).pipe(
        map((res) => {
          const { totalCount = 0, nodes = [] } = res.data?.s2sEvents ?? {};
          const list = nodes.map(({ id, startTimestamp, endTimestamp, ...rest }) => ({
            messageId: id,
            startTimestamp: getUnixTime(new Date(startTimestamp)).toString(),
            endTimestamp: getUnixTime(new Date(endTimestamp)).toString(),
            ...rest,
          })) as S2SHistoryRecord[];

          return { count: totalCount, list };
        }),
        catchError(() => {
          message.error(t('Querying failed, please try it again later'));
          return of({ count: 0, list: [] });
        })
      ),
    [fetchLockedRecords, t, toQueryVariables]
  );

  const fetchS2SRedeemRecords = useCallback(
    (req: HistoryReq) =>
      from(fetchBurnRecords({ variables: toQueryVariables(req) })).pipe(
        map((res) => {
          const list = res.data?.burnRecordEntities ?? [];

          return {
            count: list.length,
            list: list.map(
              ({ request_transaction, response_transaction, message_id, start_timestamp, end_timestamp, ...rest }) => ({
                messageId: message_id,
                requestTxHash: request_transaction,
                responseTxHash: response_transaction,
                startTimestamp: start_timestamp,
                endTimestamp: end_timestamp,
                ...rest,
              })
            ),
          };
        }),
        catchError(() => {
          message.error(t('Querying failed, please try it again later'));
          return of({ count: 0, list: [] });
        })
      ),
    [fetchBurnRecords, t, toQueryVariables]
  );

  return getNetworkMode(departure) === 'dvm' ? fetchS2SRedeemRecords : fetchS2SIssuingRecords;
}
