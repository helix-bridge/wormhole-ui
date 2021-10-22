import { message } from 'antd';
import { getUnixTime } from 'date-fns';
import { GraphQLClient, useManualQuery } from 'graphql-hooks';
import { isBoolean, isNull, omitBy } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catchError, EMPTY, from, map, Observable, of, Subscription } from 'rxjs';
import { S2S_ISSUING_RECORDS_QUERY, S2S_REDEEM_RECORDS_QUERY } from '../config';
import {
  BridgePredicateFn,
  Departure,
  HistoryReq,
  NetConfig,
  S2SBurnRecordsRes,
  S2SHistoryRecord,
  S2SLockedRecordRes,
} from '../model';
import {
  getNetConfigByVer,
  getNetworkMode,
  isEthereumNetwork,
  isPolkadotNetwork,
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

/* ---------------------------------------------------Helper Fns--------------------------------------------- */

const isSubstrate2SubstrateDVM: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isPolkadotNetwork(arrival.network) && arrival.mode === 'dvm';
};

const isSubstrateDVM2Substrate: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isPolkadotNetwork(arrival.network) && departure.mode === 'dvm';
};

const isEthereum2Darwinia: BridgePredicateFn = (departure, arrival) => {
  return isEthereumNetwork(departure.network) && isPolkadotNetwork(arrival.network) && arrival.mode === 'native';
};

const isDarwinia2Ethereum: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isEthereumNetwork(arrival.network) && departure.mode === 'native';
};

const isDVM2Ethereum: BridgePredicateFn = (departure, arrival) => {
  return isPolkadotNetwork(departure.network) && isEthereumNetwork(arrival.network) && departure.mode === 'dvm';
};

const isEthereum2DVM: BridgePredicateFn = (departure, arrival) => {
  return isEthereumNetwork(departure.network) && isPolkadotNetwork(arrival.network) && arrival.mode === 'dvm';
};

/**
 * Shorthand functions for predication without direction
 */
const isS2S: BridgePredicateFn = (departure, arrival) => {
  return [isSubstrate2SubstrateDVM, isSubstrateDVM2Substrate].some((fn) => fn(departure, arrival));
};

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
  const queryS2SRecords = useS2SRecords(getNetConfigByVer(departure)!);
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

const S2S_REDEEM_DEFAULT =
  'https://pangolin-thegraph.darwinia.network/subgraphs/name/wormhole/DarwiniaMappingTokenFactory';
const S2S_ISSUING_DEFAULT = 'https://api.subquery.network/sq/darwinia-network/pangolin';

export function useS2SRecords(
  departure: NetConfig
): (req: HistoryReq) => Observable<{ count: number; list: S2SHistoryRecord[] }> {
  const issuingClient = useMemo(
    () => new GraphQLClient({ url: departure.api.subql || S2S_ISSUING_DEFAULT }),
    [departure.api.subql]
  );
  const redeemClient = useMemo(
    () => new GraphQLClient({ url: departure.api.subGraph || S2S_REDEEM_DEFAULT }),
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
