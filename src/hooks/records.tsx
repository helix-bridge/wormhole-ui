import { message } from 'antd';
import { getUnixTime } from 'date-fns';
import { FetchData, GraphQLClient, useManualQuery } from 'graphql-hooks';
import { isBoolean, isNull, omitBy } from 'lodash';
import React, { Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catchError, EMPTY, from, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import Web3 from 'web3';
import {
  BRIDGE_DISPATCH_EVENTS,
  S2S_ISSUING_MAPPING_RECORD_QUERY,
  S2S_ISSUING_RECORDS_QUERY,
  S2S_REDEEM_RECORDS_QUERY,
  S2S_REDEEM_RECORD_QUERY,
  S2S_UNLOCK_RECORD_QUERY,
  SHORT_DURATION,
} from '../config';
import {
  ApiKeys,
  BridgeDispatchEventRecord,
  BridgeDispatchEventRes,
  ChainConfig,
  Departure,
  HistoryReq,
  S2SBurnRecord,
  S2SBurnRecordRes,
  S2SBurnRecordsRes,
  S2SHistoryRecord,
  S2SIssuingMappingRecordRes,
  S2SIssuingRecordRes,
  S2SLockedRecordRes,
  S2SUnlockRecordRes,
} from '../model';
import {
  isDarwinia2Ethereum,
  isDVM2Ethereum,
  isEthereum2Darwinia,
  isEthereum2DVM,
  isSubstrate2SubstrateDVM,
  isSubstrateDVM2Substrate,
  isTronNetwork,
  pollWhile,
  queryDarwinia2EthereumIssuingRecords,
  queryDarwiniaDVM2EthereumIssuingRecords,
  queryEthereum2DarwiniaDVMRedeemRecords,
  queryEthereum2DarwiniaGenesisRecords,
  queryEthereum2DarwiniaRedeemRecords,
  RecordsQueryRequest,
  rxGet,
  verticesToChainConfig,
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
  const { fetchS2SIssuingRecords, fetchS2SRedeemRecords } = useS2SRecords(
    verticesToChainConfig(departure)! as ChainConfig<ApiKeys>,
    verticesToChainConfig(arrival)! as ChainConfig<ApiKeys>
  );
  const genParams = useCallback(
    (params: HistoryReq) => {
      const req = omitBy<HistoryReq>(params, isNull) as HistoryReq;

      if (isTronNetwork(departure.network)) {
        return { ...req, address: window.tronWeb ? window.tronWeb.address.toHex(params.address) : '' };
      }

      return req;
    },
    [departure]
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

      if (isSubstrate2SubstrateDVM(departure, arrival)) {
        return fetchS2SIssuingRecords;
      }

      if (isSubstrateDVM2Substrate(departure, arrival)) {
        return fetchS2SRedeemRecords;
      }

      if (isEthereum2DVM(departure, arrival)) {
        return queryEthereum2DarwiniaDVMRedeemRecords;
      }

      if (isDVM2Ethereum(departure, arrival)) {
        return queryDarwiniaDVM2EthereumIssuingRecords;
      }

      return (_: HistoryReq) => EMPTY;
    },
    [departure, arrival, fetchS2SIssuingRecords, fetchS2SRedeemRecords]
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

const lockedRecordMapper = ({
  laneId,
  nonce,
  startTimestamp,
  endTimestamp,
  ...rest
}: S2SLockedRecordRes['s2sEvents']['nodes'][number]) =>
  ({
    laneId,
    nonce,
    startTimestamp: startTimestamp && getUnixTime(new Date(startTimestamp)).toString(),
    endTimestamp: endTimestamp && getUnixTime(new Date(endTimestamp)).toString(),
    ...rest,
  } as S2SHistoryRecord);

const burnRecordMapper = ({
  request_transaction,
  response_transaction,
  lane_id,
  nonce,
  start_timestamp,
  end_timestamp,
  ...rest
}: S2SBurnRecord) =>
  ({
    laneId: lane_id,
    nonce,
    requestTxHash: request_transaction,
    responseTxHash: response_transaction,
    startTimestamp: start_timestamp,
    endTimestamp: end_timestamp,
    ...rest,
  } as S2SHistoryRecord);

const issuingMappingRecordMapper = (res: S2SIssuingMappingRecordRes['lockRecordEntity']) => {
  const { transaction, recipient, amount, mapping_token } = res || {};

  return {
    responseTxHash: transaction,
    requestTxHash: transaction,
    amount,
    token: mapping_token,
    recipient,
    result: 1,
  } as S2SHistoryRecord;
};

interface FetchRecordOptions<T> {
  attemptsCount?: number;
  keepActive?: (res: T) => boolean;
  skipCache?: boolean;
}

type FetchS2SRecords = (req: HistoryReq) => Observable<{ count: number; list: S2SHistoryRecord[] }>;
type FetchS2SRecord<T, R> = (laneId: string, nonce: string, options: FetchRecordOptions<T>) => Observable<R>;

export function useS2SRecords(
  departure: ChainConfig<ApiKeys>,
  arrival: ChainConfig<ApiKeys>
): {
  fetchS2SIssuingRecords: FetchS2SRecords;
  fetchS2SRedeemRecords: FetchS2SRecords;
  fetchS2SIssuingRecord: FetchS2SRecord<S2SIssuingRecordRes, S2SHistoryRecord>;
  fetchS2SUnlockRecord: FetchS2SRecord<S2SUnlockRecordRes, S2SHistoryRecord>;
  fetchS2SRedeemRecord: FetchS2SRecord<S2SBurnRecordRes, S2SHistoryRecord>;
  fetchS2SIssuingMappingRecord: FetchS2SRecord<S2SIssuingMappingRecordRes, S2SHistoryRecord>;
  fetchMessageEvent: FetchS2SRecord<BridgeDispatchEventRes, BridgeDispatchEventRecord>;
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
  const [fetchIssuingRecord] = useManualQuery<S2SIssuingRecordRes>(S2S_UNLOCK_RECORD_QUERY, {
    skipCache: true,
    client: issuingClient,
  });
  const [fetchUnlockRecord] = useManualQuery<S2SUnlockRecordRes>(S2S_UNLOCK_RECORD_QUERY, {
    skipCache: true,
    client: issuingTargetClient,
  });
  // s2s redeem, departure pangolin-smart
  const [fetchBurnRecords] = useManualQuery<S2SBurnRecordsRes>(S2S_REDEEM_RECORDS_QUERY, {
    skipCache: true,
    client: redeemClient,
  });
  const [fetchIssuingMappingRecord] = useManualQuery<S2SIssuingMappingRecordRes>(S2S_ISSUING_MAPPING_RECORD_QUERY, {
    skipCache: true,
    client: redeemTargetClient,
  });
  const [fetchBurnRecord] = useManualQuery<S2SBurnRecordRes>(S2S_REDEEM_RECORD_QUERY, {
    skipCache: true,
    client: redeemClient,
  });
  const [fetchDispatchEvent] = useManualQuery<BridgeDispatchEventRes>(BRIDGE_DISPATCH_EVENTS, {
    skipCache: true,
    client: issuingTargetClient,
  });
  const [issuingMappingMemo, setIssuingMappingMemo] = useState<Record<string, S2SHistoryRecord>>({});
  const [unlockedMemo, setUnlockedMemo] = useState<Record<string, S2SHistoryRecord>>({});
  const [issuingMemo, setIssuingMemo] = useState<Record<string, S2SHistoryRecord>>({});
  const [burnMemo, setBurnMemo] = useState<Record<string, S2SHistoryRecord>>({});

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
          const list = nodes.map(lockedRecordMapper);

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
          const {
            paginator: { row, page },
          } = req;
          let count = list.length;

          /**
           * @see https://github.com/graphprotocol/graph-node/issues/1309
           * TODO: At redeem side, subgraph does not support total count field in graphql response, limit and offset parameters are hardcoded.
           * The count is not accurate
           */
          if (count < row) {
            count = page * row + count;
          } else {
            count = (page + 1) * row + count;
          }

          return { count, list: list.map(burnRecordMapper) };
        }),
        catchError(() => {
          message.error(t('Querying failed, please try it again later'));
          return of({ count: 0, list: [] });
        })
      ),
    [fetchBurnRecords, t, toQueryVariables]
  );

  const fetchRecord = useCallback(
    (
      id: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch: FetchData<any>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { skipCache, attemptsCount, keepActive }: Required<FetchRecordOptions<any>>,
      memo: Record<string, S2SHistoryRecord>,
      updateMemo: Dispatch<React.SetStateAction<Record<string, S2SHistoryRecord>>>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recordMapper: (res: any) => S2SHistoryRecord
    ) => {
      if (!skipCache && memo[id]) {
        return of(memo[id]);
      }

      return of(null).pipe(
        switchMap(() => from(fetch({ variables: { id } }))),
        pollWhile(SHORT_DURATION, keepActive, attemptsCount, true),
        map((res) => recordMapper(res)),
        tap((record) => {
          updateMemo({ ...memo, [id]: record });
        }),
        catchError((error) => {
          console.info(
            `%c [ query record failed with message id: ${id} ]`,
            'font-size:13px; background:pink; color:#bf2c9f;',
            error.message
          );
          return EMPTY;
        })
      );
    },
    []
  );

  const fetchS2SIssuingRecord = useCallback<FetchS2SRecord<S2SIssuingRecordRes, S2SHistoryRecord>>(
    (
      laneId: string,
      nonce: string,
      { attemptsCount = Infinity, skipCache = false, keepActive = (res) => !res.s2sEvent }
    ) => {
      return fetchRecord(
        laneId + Web3.utils.toHex(nonce),
        fetchIssuingRecord,
        { skipCache, attemptsCount, keepActive: (res) => !res.data || keepActive(res.data) },
        issuingMemo,
        setIssuingMemo,
        (res) => res.data.s2sEvent
      );
    },
    [fetchIssuingRecord, fetchRecord, issuingMemo]
  );

  const fetchS2SUnlockRecord = useCallback<FetchS2SRecord<S2SUnlockRecordRes, S2SHistoryRecord>>(
    (
      laneId: string,
      nonce: string,
      { attemptsCount = Infinity, skipCache = false, keepActive: keepActive = (res) => !res.s2sEvent }
    ) => {
      return fetchRecord(
        laneId + Web3.utils.toHex(nonce),
        fetchUnlockRecord,
        { skipCache, attemptsCount, keepActive: (res) => !res.data || keepActive(res.data) },
        unlockedMemo,
        setUnlockedMemo,
        (res) => res.data.s2sEvent
      );
    },
    [fetchRecord, fetchUnlockRecord, unlockedMemo]
  );

  const fetchS2SIssuingMappingRecord = useCallback<FetchS2SRecord<S2SIssuingMappingRecordRes, S2SHistoryRecord>>(
    (
      laneId: string,
      nonce: string,
      { attemptsCount = Infinity, skipCache = false, keepActive: keepActive = (res) => !res.lockRecordEntity }
    ) => {
      return fetchRecord(
        laneId + Web3.utils.toHex(nonce),
        fetchIssuingMappingRecord,
        { skipCache, attemptsCount, keepActive: (res) => !res.data || keepActive(res.data) },
        issuingMappingMemo,
        setIssuingMappingMemo,
        (res) => ({ ...issuingMappingRecordMapper(res.data!.lockRecordEntity), laneId, nonce })
      );
    },
    [fetchIssuingMappingRecord, fetchRecord, issuingMappingMemo]
  );

  const fetchS2SRedeemRecord = useCallback<FetchS2SRecord<S2SBurnRecordRes, S2SHistoryRecord>>(
    (
      laneId: string,
      nonce: string,
      { attemptsCount = Infinity, skipCache = false, keepActive: keepActive = (res) => !res.burnRecordEntity }
    ) => {
      return fetchRecord(
        laneId + Web3.utils.toHex(nonce),
        fetchBurnRecord,
        { skipCache, attemptsCount, keepActive: (res) => !res.data || keepActive(res.data) },
        burnMemo,
        setBurnMemo,
        (res) => burnRecordMapper(res.data!.burnRecordEntity)
      );
    },
    [burnMemo, fetchBurnRecord, fetchRecord]
  );

  const fetchMessageEvent = useCallback<FetchS2SRecord<BridgeDispatchEventRes, BridgeDispatchEventRecord>>(
    (laneId: string, nonce: string, { attemptsCount = Infinity }) => {
      return of(null).pipe(
        switchMap(() => from(fetchDispatchEvent({ variables: { id: `${laneId}${Web3.utils.toHex(nonce)}` } }))),
        pollWhile(SHORT_DURATION, (res) => !res.data?.bridgeDispatchEvent, attemptsCount, true),
        map((res) => {
          const { method, data } = res.data!.bridgeDispatchEvent;

          if (method === 'MessageDispatched') {
            const detail = JSON.parse(data || '[]');
            const resultPosition = 2;

            return { method, data, isSuccess: !(detail[resultPosition] as Record<string, string[]>).ok.length };
          }

          return { method, data, isSuccess: false };
        }),
        catchError((error) => {
          console.info(
            `%c [ query record failed with laneId ${laneId}, nonce ${nonce} ]`,
            'font-size:13px; background:pink; color:#bf2c9f;',
            error.message
          );
          return EMPTY;
        })
      );
    },
    [fetchDispatchEvent]
  );

  return {
    fetchS2SIssuingMappingRecord,
    fetchS2SUnlockRecord,
    fetchS2SIssuingRecords,
    fetchS2SRedeemRecords,
    fetchS2SRedeemRecord,
    fetchS2SIssuingRecord,
    fetchMessageEvent,
  };
}
