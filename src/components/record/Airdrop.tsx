import { CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons';
import { Form } from 'antd';
import BN from 'bn.js';
import { format, fromUnixTime } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { map } from 'rxjs';
import Web3 from 'web3';
import { crabConfig, DATE_TIME_FORMATE, FORM_CONTROL, NETWORK_LIGHT_THEME, SubscanApiPath } from '../../config';
import { airportsDepartureFilter, useApi, useNetworks } from '../../hooks';
import { ClaimsRes, ChainConfig, Network, SubscanResponse } from '../../model';
import { apiUrl, fromWei, getAirdropData, getInitialSetting, isSameNetConfig, rxGet } from '../../utils';
import { Destination } from '../form-control/Destination';
import { LinkIndicator } from '../LinkIndicator';
import { SubmitButton } from '../SubmitButton';

const SNAPSHOT_TIMESTAMP = 1584683400;
const CLAIM_ENDPOINT = 'https://crab.subscan.io';

// eslint-disable-next-line complexity
export function AirdropRecord() {
  const { t } = useTranslation();
  const {
    connection: { accounts, status },
    network,
  } = useApi();
  const [claimAmount, setClaimAmount] = useState(new BN(0));
  const [target, setTarget] = useState('');
  const { fromNetworks, setFromFilters } = useNetworks(false);
  const [fromNetwork, setFromNetwork] = useState<ChainConfig | null>(() => {
    const from = getInitialSetting('from', null);
    return fromNetworks.find((item) => item.name === from) ?? null;
  });
  const isConnectionReady = useMemo(() => {
    return status === 'success' && isSameNetConfig(network, fromNetwork);
  }, [fromNetwork, network, status]);
  const color = NETWORK_LIGHT_THEME[fromNetwork?.name ?? ('pangolin' as Network)]['@project-main-bg'];
  const { address: sender } = useMemo(() => (accounts || [])[0] ?? '', [accounts]);
  const amount = useMemo(
    () => (fromNetwork?.name ? getAirdropData(sender, fromNetwork.name) : 0),
    [sender, fromNetwork]
  );

  useEffect(() => {
    setFromFilters([airportsDepartureFilter]);
  }, [setFromFilters]);

  useEffect(() => {
    // FIXME: api error because of cors
    const sub$$ = rxGet<SubscanResponse<ClaimsRes>>({
      url: apiUrl(CLAIM_ENDPOINT, SubscanApiPath.claims),
      params: { address: sender },
    })
      .pipe(map((res) => res?.data?.info))
      .subscribe({
        next: (info = []) => {
          const data = info[0] as { amount: number; target: string };

          if (data) {
            setClaimAmount(Web3.utils.toBN(data.amount));
            setTarget(data.target);
          }
        },
        error: (_) => {
          console.error('%c subscan api error:', 'font-size:13px; background:pink; color:#bf2c9f;');
        },
      });

    return () => {
      sub$$.unsubscribe();
    };
  }, [sender]);

  return (
    <Form layout="vertical" initialValues={{ host: fromNetwork }}>
      <Form.Item name="host" label={t('Host Network')} rules={[{ required: true }]} className="mb-0">
        <Destination
          networks={fromNetworks}
          extra={<LinkIndicator config={fromNetwork} />}
          onChange={(value) => {
            if (value) {
              setFromNetwork(value);
            }
          }}
        />
      </Form.Item>

      {isConnectionReady && (
        <>
          <Form.Item
            label={
              <span className="capitalize">{t('Connected to {{network}}', { network: fromNetwork?.name ?? '' })}</span>
            }
            name={FORM_CONTROL.sender}
          >
            <div className="flex flex-col px-4 py-2 rounded-lg bg-gray-900">{sender}</div>
          </Form.Item>

          <Form.Item name={FORM_CONTROL.recipient} hidden={!isConnectionReady} label={t('Destination')}>
            <div className="flex flex-col px-4 py-2 rounded-lg bg-gray-900">{target || '-'}</div>
          </Form.Item>

          <Form.Item label={<span className="capitalize">{t('Snapshot data')}</span>}>
            <div className="flex flex-col px-4 py-2 rounded-lg bg-gray-900">
              {claimAmount.eq(new BN(0)) ? fromWei({ value: new BN(amount || 0) }) : fromWei({ value: claimAmount })}{' '}
              RING
              <span>{format(fromUnixTime(SNAPSHOT_TIMESTAMP), DATE_TIME_FORMATE + ' zz')}</span>
            </div>
          </Form.Item>

          <Form.Item label={t('Claim Result')}>
            <div className="flex items-center px-4 py-2 rounded-lg bg-gray-900">
              {target ? (
                <CheckCircleFilled style={{ color }} className="text-2xl" />
              ) : (
                <CloseCircleOutlined className="text-2xl text-red-500" />
              )}
              <span className="ml-4">{t(target ? 'Claims' : 'Not Claimed')}</span>
            </div>
          </Form.Item>
        </>
      )}
      <SubmitButton from={fromNetwork} to={crabConfig} hideSubmit></SubmitButton>
    </Form>
  );
}
