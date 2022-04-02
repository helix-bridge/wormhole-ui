import { Breadcrumb } from 'antd';
import ErrorBoundary from 'antd/lib/alert/ErrorBoundary';
import BreadcrumbItem from 'antd/lib/breadcrumb/BreadcrumbItem';
import { GraphQLClient, useManualQuery } from 'graphql-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, withRouter } from 'react-router-dom';
import { from } from 'rxjs';
import { S2S_ISSUING_RECORD_QUERY, S2S_REDEEM_RECORD_QUERY } from '../../bridges/substrate-substrateDVM/config';
import { EllipsisMiddle } from '../../components/widget/EllipsisMiddle';
import { Arrival, Departure, Substrate2SubstrateRecord } from '../../model';
import { getBridge } from '../../utils';

export function useRecordQuery<T>(id: string, direction: [Departure, Arrival]) {
  const bridge = getBridge(direction);
  const isIssuing = bridge.isIssuing(...direction);
  const apiKey = isIssuing ? 'subql' : 'subGraph';
  // TODO: handle query
  const query = isIssuing ? S2S_ISSUING_RECORD_QUERY : S2S_REDEEM_RECORD_QUERY;
  const reg = /\S\w+\(/g;
  const resultKey = query.match(reg)?.reverse()[0].slice(0, -1) as string;
  const url = (bridge.config.api || {})[apiKey];
  const [fetchRecord, state] = useManualQuery<T>(query, {
    client: new GraphQLClient({ url: url.endsWith('-') ? url + bridge.departure.name : url }),
    variables: { id },
  });

  return { fetchRecord, state, resultKey };
}

function Page() {
  const { t } = useTranslation();
  const param = useParams<{ id: string }>();
  const { state, search } = useLocation<Substrate2SubstrateRecord | null>();

  const direction = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const departure = {};
    const arrival = {};

    searchParams.forEach((value, key) => {
      if (key.startsWith('from')) {
        Object.assign(departure, { [/from$/.test(key) ? 'network' : 'mode']: value });
      }
      if (key.startsWith('to')) {
        Object.assign(arrival, { [/to$/.test(key) ? 'network' : 'mode']: value });
      }
    });

    return [departure, arrival] as [Departure, Arrival];
  }, [search]);

  const { id } = param;
  const { fetchRecord, resultKey } = useRecordQuery(id, direction);
  const [record, setRecord] = useState<Substrate2SubstrateRecord | null>(state);

  useEffect(() => {
    if (record) {
      return;
    }

    const sub$$ = from(fetchRecord()).subscribe((res) => {
      const result = (res.data as Record<string, unknown>)[resultKey] as Substrate2SubstrateRecord;

      setRecord(result);
    });

    return () => sub$$?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('🚀 ~ file: TransactionDetail.tsx ~ line 5 ~ Page ~ tx', param, state, search);
  return (
    <ErrorBoundary>
      <Breadcrumb>
        <BreadcrumbItem>{t('Explorer')}</BreadcrumbItem>
        <BreadcrumbItem>{t('Transaction')}</BreadcrumbItem>
        <BreadcrumbItem>
          <span className="w-32 overflow-hidden">
            <EllipsisMiddle className="w-3/4 inline-block">{id}</EllipsisMiddle>
          </span>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <h3>{t('transaction detail')}</h3>
        <div></div>
      </div>
    </ErrorBoundary>
  );
}

export const TransactionsDetail = withRouter(Page);
