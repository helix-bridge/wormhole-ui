import { CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons';
import BN from 'bn.js';
import { format, fromUnixTime } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { map } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import Web3 from 'web3';
import { DATE_TIME_FORMATE, NETWORK_CONFIG, NETWORK_LIGHT_THEME, SubscanApiPath } from '../../config';
import { useApi } from '../../hooks';
import { ClaimsRes, Network, SResponse } from '../../model';
import { apiUrl, fromWei, getAirdropData } from '../../utils';
import { Des } from '../modal/Des';

export interface AirdropProps {
  from: Network;
  to: Network;
}

const SNAPSHOT_TIMESTAMP = 1584683400;

// eslint-disable-next-line complexity
export function AirdropRecords({ from, to }: AirdropProps) {
  const { t } = useTranslation();
  const {
    connection: { accounts },
  } = useApi();
  const { address: sender } = (accounts || [])[0] ?? '';
  const [claimAmount, setClaimAmount] = useState(new BN(0));
  const [target, setTarget] = useState('');
  const fromNetwork = NETWORK_CONFIG[from];
  const toNetwork = NETWORK_CONFIG[to];
  const color = NETWORK_LIGHT_THEME[fromNetwork.name as Network]['@project-main-bg'];
  const amount = useMemo(() => getAirdropData(sender, fromNetwork.name), [sender, fromNetwork]);

  useEffect(() => {
    const sub$$ = ajax<SResponse<ClaimsRes>>({
      url: apiUrl(toNetwork!.api.subscan, SubscanApiPath.claims),
      method: 'POST',
      body: { address: sender },
    })
      .pipe(map((res) => res.response.data?.info))
      .subscribe((info = []) => {
        const data = info[0] as { amount: number; target: string };

        if (data) {
          setClaimAmount(Web3.utils.toBN(data.amount));
          setTarget(data.target);
        }
      });

    return () => {
      sub$$.unsubscribe();
    };
  }, [sender, toNetwork]);

  return (
    <>
      <Des
        title={<span className="capitalize">{t('Connected to {{network}}', { network: fromNetwork?.name })}</span>}
        content={sender}
        icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>

      <Des
        title={<span className="capitalize">{t('Snapshot data')}</span>}
        content={
          <span>
            {claimAmount.eq(new BN(0)) ? fromWei({ value: new BN(amount || 0) }) : fromWei({ value: claimAmount })} RING
            <p>{format(fromUnixTime(SNAPSHOT_TIMESTAMP), DATE_TIME_FORMATE + ' zz')}</p>
          </span>
        }
        icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>

      <Des
        title={t('Destination')}
        content={target || '--'}
        icon={<CheckCircleFilled style={{ color }} className="text-2xl" />}
      ></Des>

      <Des
        title={t('Claim Result')}
        content={t(target ? 'Claims' : 'Not Claimed')}
        icon={
          target ? (
            <CheckCircleFilled style={{ color }} className="text-2xl" />
          ) : (
            <CloseCircleOutlined style={{ color: 'red' }} className="text-2xl" />
          )
        }
      ></Des>
    </>
  );
}
