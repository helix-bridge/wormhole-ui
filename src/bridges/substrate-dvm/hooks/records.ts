import { GraphQLClient, useManualQuery, FetchData } from 'graphql-hooks';
import { useMemo, useCallback } from 'react';
import { Observable, from, map, catchError, EMPTY } from 'rxjs';
import { TRANSFERS_QUERY } from '../config';
import { HistoryReq, ChainConfig, PolkadotChainConfig } from '../../../model';
import { getBridge, convertToSS58, dvmAddressToAccountId } from '../../../utils';
import { SubstrateSubstrateDVMBridgeConfig } from '../../substrate-substrateDVM/model/bridge';
import { Substrate2DVMRecord, Substrate2DVMRecordsRes, DVM2SubstrateRecordsRes } from '../model';

type FetchSubstrate2DVMRecords = (
  req: Omit<HistoryReq, 'confirmed'>
) => Observable<{ count: number; list: Substrate2DVMRecord[] }>;

const UNKNOWN_CLIENT = 'unknown';

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
