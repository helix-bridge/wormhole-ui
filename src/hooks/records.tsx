import { message } from 'antd';
import camelCaseKeys from 'camelcase-keys';
import { getUnixTime } from 'date-fns';
import { FetchData, GraphQLClient, useManualQuery } from 'graphql-hooks';
import { isBoolean, isNull, omitBy } from 'lodash';
import React, { Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catchError, EMPTY, from, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import Web3 from 'web3';
import {
  BRIDGE_DISPATCH_EVENTS,
  S2S_ISSUING_RECORDS_QUERY,
  S2S_ISSUING_RECORD_QUERY,
  S2S_REDEEM_RECORDS_QUERY,
  S2S_REDEEM_RECORD_QUERY,
  SHORT_DURATION,
  TRANSFERS_QUERY,
} from '../config';
import {
  BridgeDispatchEventRecord,
  BridgeDispatchEventRes,
  ChainConfig,
  Departure,
  DVM2SubstrateRecordsRes,
  HistoryReq,
  PolkadotChainConfig,
  SubstrateDVM2SubstrateRecord,
  SubstrateDVM2SubstrateRecordRes,
  SubstrateDVM2SubstrateRecordsRes,
  Substrate2SubstrateDVMRecord,
  Substrate2SubstrateDVMRecordRes,
  Substrate2SubstrateDVMRecordsRes,
  Substrate2DVMRecord,
  Substrate2DVMRecordsRes,
  SubstrateSubstrateDVMBridgeConfig,
} from '../model';
import {
  convertToSS58,
  dvmAddressToAccountId,
  getBridge,
  isDarwinia2Ethereum,
  isDVM2Ethereum,
  isDVM2Substrate,
  isEthereum2Darwinia,
  isEthereum2DVM,
  isSubstrate2DVM,
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
    verticesToChainConfig(departure),
    verticesToChainConfig(arrival)
  );

  const genParams = useCallback((params: HistoryReq) => {
    const req = omitBy<HistoryReq>(params, isNull) as HistoryReq;
    const [dep] = params.direction;

    if (isTronNetwork(dep.network)) {
      return { ...req, address: window.tronWeb ? window.tronWeb.address.toHex(params.address) : '' };
    }

    return req;
  }, []);

  const { fetchDVM2SubstrateRecords, fetchSubstrate2DVMRecords } = useSubstrate2DVMRecords(
    verticesToChainConfig(departure),
    verticesToChainConfig(arrival)
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

      if (isSubstrate2DVM(departure, arrival)) {
        return fetchSubstrate2DVMRecords;
      }

      if (isDVM2Substrate(departure, arrival)) {
        return fetchDVM2SubstrateRecords;
      }

      return (_: HistoryReq) => EMPTY;
    },
    [
      departure,
      arrival,
      fetchS2SIssuingRecords,
      fetchS2SRedeemRecords,
      fetchSubstrate2DVMRecords,
      fetchDVM2SubstrateRecords,
    ]
  );

  const queryRecords = useCallback(
    (params: HistoryReq, isGenesis: boolean) => {
      const { direction, address } = params;

      if (!direction || !address) {
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
interface FetchRecordOptions<T> {
  attemptsCount?: number;
  keepActive?: (res: T) => boolean;
  skipCache?: boolean;
}

type FetchS2SRecords = (req: HistoryReq) => Observable<{ count: number; list: Substrate2SubstrateDVMRecord[] }>;
type FetchS2SRecord<T, R> = (laneId: string, nonce: string, options: FetchRecordOptions<T>) => Observable<R>;

export function useS2SRecords(
  departure: ChainConfig,
  arrival: ChainConfig
): {
  fetchS2SIssuingRecords: FetchS2SRecords;
  fetchS2SRedeemRecords: FetchS2SRecords;
  fetchS2SIssuingRecord: FetchS2SRecord<Substrate2SubstrateDVMRecordRes, Substrate2SubstrateDVMRecord>;
  fetchS2SRedeemRecord: FetchS2SRecord<SubstrateDVM2SubstrateRecordRes, Substrate2SubstrateDVMRecord>;
  fetchMessageEvent: FetchS2SRecord<BridgeDispatchEventRes, BridgeDispatchEventRecord>;
} {
  const api = useMemo(
    () => getBridge<SubstrateSubstrateDVMBridgeConfig>([departure, arrival]).config.api,
    [departure, arrival]
  );
  const issuingClient = useMemo(
    () => new GraphQLClient({ url: `${api.subql}${departure.name}` || UNKNOWN_CLIENT }),
    [api.subql, departure.name]
  );
  const issuingTargetClient = useMemo(
    () => new GraphQLClient({ url: `${api.subql}${arrival.name}` || UNKNOWN_CLIENT }),
    [api.subql, arrival.name]
  );
  const redeemClient = useMemo(() => new GraphQLClient({ url: api.subGraph || UNKNOWN_CLIENT }), [api.subGraph]);
  const { t } = useTranslation();
  // s2s issuing
  const [fetchIssuingRecords] = useManualQuery<Substrate2SubstrateDVMRecordsRes>(S2S_ISSUING_RECORDS_QUERY, {
    skipCache: true,
    client: issuingClient,
  });
  const [fetchIssuingRecord] = useManualQuery<Substrate2SubstrateDVMRecordRes>(S2S_ISSUING_RECORD_QUERY, {
    skipCache: true,
    client: issuingClient,
  });
  // s2s redeem, departure pangolin-smart
  const [fetchBurnRecords] = useManualQuery<SubstrateDVM2SubstrateRecordsRes>(S2S_REDEEM_RECORDS_QUERY, {
    skipCache: true,
    client: redeemClient,
  });
  const [fetchBurnRecord] = useManualQuery<SubstrateDVM2SubstrateRecordRes>(S2S_REDEEM_RECORD_QUERY, {
    skipCache: true,
    client: redeemClient,
  });
  const [fetchDispatchEvent] = useManualQuery<BridgeDispatchEventRes>(BRIDGE_DISPATCH_EVENTS, {
    skipCache: true,
    client: issuingTargetClient,
  });
  const [issuingMemo, setIssuingMemo] = useState<Record<string, Substrate2SubstrateDVMRecord>>({});
  const [burnMemo, setBurnMemo] = useState<Record<string, Substrate2SubstrateDVMRecord>>({});

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
        fetchIssuingRecords({
          variables: toQueryVariables(req),
        })
      ).pipe(
        map((res) => {
          const { totalCount = 0, nodes = [] } = res.data?.s2sEvents ?? {};
          const list = nodes.map(({ startTimestamp, endTimestamp, ...rest }) => ({
            ...rest,
            startTimestamp: startTimestamp && getUnixTime(new Date(startTimestamp)).toString(),
            endTimestamp: endTimestamp && getUnixTime(new Date(endTimestamp)).toString(),
          }));

          return { count: totalCount, list };
        }),
        catchError(() => {
          message.error(t('Querying failed, please try it again later'));
          return of({ count: 0, list: [] });
        })
      ),
    [fetchIssuingRecords, t, toQueryVariables]
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

          return {
            count,
            list: list.map((item) => {
              const {
                requestTransaction: requestTxHash,
                responseTransaction: responseTxHash,
                ...rest
              } = camelCaseKeys(item);

              return { ...rest, requestTxHash, responseTxHash };
            }),
          };
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
      memo: Record<string, Substrate2SubstrateDVMRecord>,
      updateMemo: Dispatch<React.SetStateAction<Record<string, Substrate2SubstrateDVMRecord>>>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recordMapper: (res: any) => Substrate2SubstrateDVMRecord
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

  const fetchS2SIssuingRecord = useCallback<
    FetchS2SRecord<Substrate2SubstrateDVMRecordRes, Substrate2SubstrateDVMRecord>
  >(
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

  const fetchS2SRedeemRecord = useCallback<
    FetchS2SRecord<SubstrateDVM2SubstrateRecordRes, Substrate2SubstrateDVMRecord>
  >(
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
        (res) => {
          const {
            responseTransaction: responseTxHash,
            requestTransaction: requestTxHash,
            ...rest
          } = camelCaseKeys(res.data!.burnRecordEntity as unknown as SubstrateDVM2SubstrateRecord);

          return { ...rest, responseTxHash, requestTxHash };
        }
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
          const { method, data, ...rest } = res.data!.bridgeDispatchEvent;

          if (method === 'MessageDispatched') {
            const detail = JSON.parse(data || '[]');
            const resultPosition = 2;

            return {
              ...rest,
              method,
              data,
              isSuccess: !(detail[resultPosition] as Record<string, string[]>).ok.length,
            };
          }

          return { ...rest, method, data, isSuccess: false };
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
    fetchS2SIssuingRecords,
    fetchS2SRedeemRecords,
    fetchS2SRedeemRecord,
    fetchS2SIssuingRecord,
    fetchMessageEvent,
  };
}

/* ---------------------------------------------------Substrate 2 DVM(smart app) records--------------------------------------------- */

type FetchSubstrate2DVMRecords = (
  req: Omit<HistoryReq, 'confirmed'>
) => Observable<{ count: number; list: Substrate2DVMRecord[] }>;

export function useSubstrate2DVMRecords(
  departure: ChainConfig,
  arrival: ChainConfig
): {
  fetchDVM2SubstrateRecords: FetchSubstrate2DVMRecords;
  fetchSubstrate2DVMRecords: FetchSubstrate2DVMRecords;
} {
  const api = useMemo(
    () => getBridge<SubstrateSubstrateDVMBridgeConfig>([departure, arrival]).config.api,
    [departure, arrival]
  );

  const issuingClient = useMemo(
    () => new GraphQLClient({ url: `${api.subql}${departure.name}` || UNKNOWN_CLIENT }),
    [api.subql, departure.name]
  );

  const redeemClient = useMemo(
    () => new GraphQLClient({ url: `${api.subql}${arrival.name}` || UNKNOWN_CLIENT }),
    [api.subql, arrival.name]
  );

  const [fetchIssuingRecords] = useManualQuery<Substrate2DVMRecordsRes>(TRANSFERS_QUERY, {
    skipCache: true,
    client: issuingClient,
  });

  const [fetchRedeemRecords] = useManualQuery<DVM2SubstrateRecordsRes>(TRANSFERS_QUERY, {
    skipCache: true,
    client: redeemClient,
  });

  const ss58Prefix = useMemo(() => (departure as PolkadotChainConfig).ss58Prefix, [departure]);

  const fetchRecords = useCallback(
    (
      req: Omit<HistoryReq, 'confirmed'>,
      fetch: FetchData<Substrate2DVMRecordsRes, Record<string, unknown>, unknown>
    ) => {
      const {
        paginator: { row, page },
        address,
      } = req;

      return from(
        fetch({
          variables: {
            limit: row,
            offset: page,
            account: address,
          },
          skipCache: true,
        })
      ).pipe(
        map((res) => {
          const { totalCount = 0, nodes = [] } = res.data?.transfers ?? {};

          return { count: totalCount, list: nodes };
        }),
        catchError(() => EMPTY)
      );
    },
    []
  );

  const fetchSubstrate2DVMRecords = useCallback(
    (req: Omit<HistoryReq, 'confirmed'>) =>
      fetchRecords({ ...req, address: convertToSS58(req.address, ss58Prefix) }, fetchIssuingRecords),
    [ss58Prefix, fetchIssuingRecords, fetchRecords]
  );

  const fetchDVM2SubstrateRecords = useCallback(
    (req: Omit<HistoryReq, 'confirmed'>) =>
      fetchRecords(
        {
          ...req,
          address: convertToSS58(dvmAddressToAccountId(req.address).toHuman() as string, ss58Prefix),
        },
        fetchRedeemRecords
      ),
    [ss58Prefix, fetchRecords, fetchRedeemRecords]
  );

  return {
    fetchDVM2SubstrateRecords,
    fetchSubstrate2DVMRecords,
  };
}
