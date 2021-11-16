import { message } from 'antd';
import { getUnixTime } from 'date-fns';
import { GraphQLClient, useManualQuery } from 'graphql-hooks';
import { isBoolean, isNull, omitBy } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catchError, EMPTY, from, map, Observable, of, retryWhen, Subscription, delay } from 'rxjs';
import {
  S2S_ISSUING_MAPPING_RECORD_QUERY,
  S2S_ISSUING_RECORDS_QUERY,
  S2S_REDEEM_RECORDS_QUERY,
  S2S_UNLOCK_RECORD_QUERY,
  SHORT_DURATION,
} from '../config';
import {
  Departure,
  HistoryReq,
  ChainConfig,
  S2SBurnRecordsRes,
  S2SHistoryRecord,
  S2SLockedRecordRes,
  S2SIssuingRecord,
  s2sUnlockRecord,
} from '../model';
import {
  verticesToNetConfig,
  getNetworkMode,
  isDarwinia2Ethereum,
  isDVM2Ethereum,
  isEthereum2Darwinia,
  isEthereum2DVM,
  isS2S,
  isSubstrateDVM2Substrate,
  isTronNetwork,
  queryDarwinia2EthereumIssuingRecords,
  queryDarwiniaDVM2EthereumIssuingRecords,
  queryEthereum2DarwiniaDVMRedeemRecords,
  queryEthereum2DarwiniaGenesisRecords,
  queryEthereum2DarwiniaRedeemRecords,
  RecordsQueryRequest,
  rxGet,
} from '../utils';

interface RecordsHook<T> {
  loading: boolean;
  error?: Record<string, unknown> | null;
  data: T | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch?: (...args: any) => Subscription;
}

/* ---------------------------------------------------Common Query--------------------------------------------- */

export function useRecordsQuery<T = unknown>(req: RecordsQueryRequest): RecordsHook<T> {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Record<string, unknown> | null>(null);
  const [data, setData] = useState<T | null>(null);
  const query = useCallback((request: RecordsQueryRequest) => {
    setLoading(true);

    return rxGet<T>(request).subscribe({
      next: (res) => {
        setData(res);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
      complete: () => {
        setLoading(false);
      },
    });
  }, []);

  useEffect(() => {
    const sub$$ = query(req);
    return () => {
      sub$$.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    data,
    error,
    refetch: query,
  };
}

export function useRecords(departure: Departure, arrival: Departure) {
  const { queryS2SRecords } = useS2SRecords(verticesToNetConfig(departure)!, verticesToNetConfig(arrival)!);
  const genParams = useCallback(
    (params: HistoryReq) => {
      const req = omitBy<HistoryReq>(params, isNull) as HistoryReq;

      if (isTronNetwork(departure.network)) {
        return { ...req, address: window.tronWeb ? window.tronWeb.address.toHex(params.address) : '' };
      }

      /**
       * @see https://github.com/graphprotocol/graph-node/issues/1309
       * TODO: At redeem side, subgraph does not support total count field in graphql response, limit and offset parameters are hardcoded.
       */
      if (isSubstrateDVM2Substrate(departure, arrival)) {
        return { ...req, paginator: { row: 200, page: 0 } };
      }

      return req;
    },
    [arrival, departure]
  );

  const genQueryFn = useCallback<(isGenesis: boolean) => (req: HistoryReq) => Observable<unknown>>(
    // eslint-disable-next-line complexity
    (isGenesis = false) => {
      if (isTronNetwork(departure.network) || (isEthereum2Darwinia(departure, arrival) && isGenesis)) {
        return queryEthereum2DarwiniaGenesisRecords;
      }

      if (isEthereum2Darwinia(departure, arrival) && !isGenesis) {
        return queryEthereum2DarwiniaRedeemRecords;
      }

      if (isDarwinia2Ethereum(departure, arrival)) {
        return queryDarwinia2EthereumIssuingRecords;
      }

      if (isS2S(departure, arrival)) {
        return queryS2SRecords;
      }

      if (isEthereum2DVM(departure, arrival)) {
        return queryEthereum2DarwiniaDVMRedeemRecords;
      }

      if (isDVM2Ethereum(departure, arrival)) {
        return queryDarwiniaDVM2EthereumIssuingRecords;
      }

      return (_: HistoryReq) => EMPTY;
    },
    [departure, arrival, queryS2SRecords]
  );

  const queryRecords = useCallback(
    (params: HistoryReq, isGenesis: boolean) => {
      const { network, address } = params;

      if (!network || !address) {
        return EMPTY;
      }

      const req = genParams(params);
      const fn = genQueryFn(isGenesis);

      return fn(req);
    },
    [genParams, genQueryFn]
  );

  return { queryRecords };
}

/* ---------------------------------------------------S2S Query--------------------------------------------- */

enum S2SRecordResult {
  locked,
  lockConfirmedSuccess,
  lockConfirmedFail,
}

const UNKNOWN_CLIENT = 'unknown';

export function useS2SRecords(
  departure: ChainConfig,
  arrival: ChainConfig
): {
  queryS2SRecords: (req: HistoryReq) => Observable<{ count: number; list: S2SHistoryRecord[] }>;
  queryS2SRecord: (id: string) => Observable<S2SHistoryRecord>;
} {
  const issuingClient = useMemo(
    () => new GraphQLClient({ url: departure.api.subql || UNKNOWN_CLIENT }),
    [departure.api.subql]
  );
  const issuingTargetClient = useMemo(
    () => new GraphQLClient({ url: arrival.api.subql || UNKNOWN_CLIENT }),
    [arrival.api.subql]
  );
  const redeemClient = useMemo(
    () => new GraphQLClient({ url: departure.api.subGraph || UNKNOWN_CLIENT }),
    [departure.api.subGraph]
  );
  const redeemTargetClient = useMemo(
    () => new GraphQLClient({ url: arrival.api.subGraph || UNKNOWN_CLIENT }),
    [arrival.api.subGraph]
  );
  const { t } = useTranslation();
  // s2s issuing
  const [fetchLockedRecords] = useManualQuery<S2SLockedRecordRes>(S2S_ISSUING_RECORDS_QUERY, {
    skipCache: true,
    client: issuingClient,
  });
  const [fetchUnlockRecord] = useManualQuery<s2sUnlockRecord>(S2S_UNLOCK_RECORD_QUERY, {
    skipCache: true,
    client: issuingTargetClient,
  });
  // s2s redeem, departure pangolin-smart
  const [fetchBurnRecords] = useManualQuery<S2SBurnRecordsRes>(S2S_REDEEM_RECORDS_QUERY, {
    skipCache: true,
    client: redeemClient,
  });
  const [fetchIssuingMappingRecord] = useManualQuery<S2SIssuingRecord>(S2S_ISSUING_MAPPING_RECORD_QUERY, {
    skipCache: true,
    client: redeemTargetClient,
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

    return { account, limit, offset: offset * limit, result };
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
            startTimestamp: startTimestamp && getUnixTime(new Date(startTimestamp)).toString(),
            endTimestamp: endTimestamp && getUnixTime(new Date(endTimestamp)).toString(),
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

  const queryS2SLockedRecord = useCallback(
    (id: string) => {
      return from(fetchUnlockRecord({ variables: { id } })).pipe(
        map((res) => {
          if (res.data?.s2sEvent && !!res.data.s2sEvent) {
            return res.data.s2sEvent;
          } else {
            throw new Error();
          }
        }),
        retryWhen((_) => {
          return from(fetchUnlockRecord({ variables: { id } })).pipe(delay(SHORT_DURATION));
        })
      );
    },
    [fetchUnlockRecord]
  );

  const queryS2SIssuingMappingRecord = useCallback(
    (id: string) => {
      return from(fetchIssuingMappingRecord({ variables: { id } })).pipe(
        map((res) => {
          if (res.data?.lockRecordEntity && !!res.data?.lockRecordEntity) {
            const { transaction, recipient, amount, mapping_token, message_id } = res.data.lockRecordEntity;

            return {
              responseTxHash: transaction,
              requestTxHash: transaction,
              amount,
              token: mapping_token,
              messageId: message_id,
              recipient,
            } as S2SHistoryRecord;
          } else {
            throw new Error();
          }
        }),
        retryWhen((_) => {
          return from(fetchIssuingMappingRecord({ variables: { id } })).pipe(delay(SHORT_DURATION));
        })
      );
    },
    [fetchIssuingMappingRecord]
  );

  return getNetworkMode(departure) === 'dvm'
    ? {
        queryS2SRecords: fetchS2SRedeemRecords,
        queryS2SRecord: queryS2SLockedRecord,
      }
    : {
        queryS2SRecords: fetchS2SIssuingRecords,
        queryS2SRecord: queryS2SIssuingMappingRecord,
      };
}
