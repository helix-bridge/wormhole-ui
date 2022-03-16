import { FetchData, GraphQLClient, useManualQuery } from 'graphql-hooks';
import { useCallback, useMemo } from 'react';
import { catchError, EMPTY, from, map } from 'rxjs';
import { ChainConfig, PolkadotChainConfig, RecordList, RecordRequestParams, RecordsHooksResult } from '../../../model';
import { convertToDvm, convertToSS58, dvmAddressToAccountId, getBridge, isDVM2Substrate } from '../../../utils';
import { SubstrateSubstrateDVMBridgeConfig } from '../../substrate-substrateDVM/model/bridge';
import { TRANSFERS_QUERY } from '../config';
import { DVM2SubstrateRecordsRes, Substrate2DVMRecord, Substrate2DVMRecordsRes } from '../model';

const UNKNOWN_CLIENT = 'unknown';

export function useRecords(
  departure: ChainConfig,
  arrival: ChainConfig
): RecordsHooksResult<RecordList<Substrate2DVMRecord>, Omit<RecordRequestParams, 'confirmed'>> {
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
      req: Omit<RecordRequestParams, 'confirmed'>,
      fetch: FetchData<Substrate2DVMRecordsRes, Record<string, unknown>, unknown>
    ) => {
      const {
        paginator: { row, page },
        address,
        direction,
      } = req;

      return from(
        fetch({
          variables: {
            limit: row,
            offset: page * row,
            account: convertToDvm(address),
            // FIXME: https://github.com/darwinia-network/darwinia-common/issues/1123 this issue will be fix the record from dvm to substrate
            method: isDVM2Substrate(...direction) ? 'Endowed' : 'Transfer',
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
    (req: Omit<RecordRequestParams, 'confirmed'>) =>
      fetchRecords({ ...req, address: convertToSS58(req.address, ss58Prefix) }, fetchIssuingRecords),
    [ss58Prefix, fetchIssuingRecords, fetchRecords]
  );

  const fetchDVM2SubstrateRecords = useCallback(
    (req: Omit<RecordRequestParams, 'confirmed'>) =>
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
    fetchRedeemRecords: fetchDVM2SubstrateRecords,
    fetchIssuingRecords: fetchSubstrate2DVMRecords,
  };
}
