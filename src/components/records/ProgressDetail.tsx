import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Row, Tag } from 'antd';
import { PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTx } from '../../hooks';
import { Network } from '../../model';
import { isPolkadotNetwork } from '../../utils';
import { SubscanLink } from '../SubscanLink';
import stepCrabIcon from './tx-image/tx-step-crab-icon.svg';
import stepInactiveCrabIcon from './tx-image/tx-step-crab-inactive-icon.svg';
import stepDarwiniaIcon from './tx-image/tx-step-darwinia-icon.svg';
import stepInactiveDarwiniaIcon from './tx-image/tx-step-darwinia-inactive-icon.svg';
import stepEthereumIcon from './tx-image/tx-step-eth-icon.svg';
import stepInactiveEthereumIcon from './tx-image/tx-step-eth-inactive-icon.svg';
import stepRelayIcon from './tx-image/tx-step-relay-icon.svg';
import stepInactiveRelayIcon from './tx-image/tx-step-relay-inactive-icon.svg';
import stepStartIcon from './tx-image/tx-step-start-icon.svg';
import stepTronIcon from './tx-image/tx-step-tron-icon.svg';
import stepInactiveTronIcon from './tx-image/tx-step-tron-inactive-icon.svg';

interface ProgressInfo {
  network: Network;
  txHash?: string;
}

export interface ProgressDetailProps {
  from: ProgressInfo;
  to: ProgressInfo;
  hasRelay: boolean;
  // eslint-disable-next-line no-magic-numbers
  step: 2 | 3 | 4;
  claim?: () => void;
}

export enum CrosseState {
  // eslint-disable-next-line no-magic-numbers
  takeOff = 2,
  relayed,
  claimed,
}

export const txProgressIcon = {
  stepStartIcon,
  stepEthereumIcon,
  stepInactiveEthereumIcon,
  stepDarwiniaIcon,
  stepInactiveDarwiniaIcon,
  stepTronIcon,
  stepInactiveTronIcon,
  stepCrabIcon,
  stepInactiveCrabIcon,
  stepRelayIcon,
  stepInactiveRelayIcon,
};

type TxIconName = keyof typeof txProgressIcon;

function textCase(text: string, type: 'capitalize' | 'uppercase' | 'lowercase'): string {
  if (!text) return '';

  if (type === 'capitalize') {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  if (type === 'uppercase') {
    return text.toUpperCase();
  }

  if (type === 'lowercase') {
    return text.toLowerCase();
  }

  return text;
}

const StepWrapper = ({
  children,
  icon,
  title,
  className,
}: PropsWithChildren<{ icon: string; title: string; className?: string }>) => {
  return (
    <Row
      className={`step flex flex-col justify-around items-center h-36 text-center text-xs md:text-base after:bg-white dark:after:bg-gray-800 dark:after:bg-opacity-20 ${
        className || ''
      }`}
    >
      <Row className="flex flex-col justify-center items-center">
        <img src={icon} className="w-4 md:w-10" />
        <span className="capitalize mt-4 dark:text-gray-200 text-gray-900">{title}</span>
      </Row>
      <Row style={{ minHeight: 24 }}>{children}</Row>
    </Row>
  );
};

// eslint-disable-next-line complexity
export function ProgressDetail({ from, to, step, hasRelay, claim }: ProgressDetailProps) {
  const { t } = useTranslation();
  const { tx } = useTx();
  const { txHash: fromHash, network: fromNetwork } = from;
  const { txHash: toHash, network: toNetwork } = to;
  // const needConfirm = step === ProgressStep.confirm;
  const needClaim = step >= CrosseState.claimed;
  const relayed = step >= CrosseState.relayed;
  const iconName = useCallback(
    (chain: string, byNeedConfirm = false) => {
      const name = isPolkadotNetwork(chain as Network) ? 'Darwinia' : 'Ethereum';

      if (byNeedConfirm) {
        return `step${needClaim ? '' : 'Inactive'}${textCase(name, 'capitalize')}Icon` as TxIconName;
      } else {
        return `step${textCase(name, 'capitalize')}Icon` as TxIconName;
      }
    },
    [needClaim]
  );

  return (
    <div className={'grid bg-gray-800 bg-opacity-20 progress-steps ' + (hasRelay ? 'grid-cols-4' : 'grid-cols-3')}>
      <StepWrapper icon={stepStartIcon} title="Transaction Send"></StepWrapper>

      <StepWrapper
        icon={txProgressIcon[iconName(fromNetwork)]}
        title={t('{{chain}} Confirmed', { chain: fromNetwork })}
      >
        <SubscanLink txHash={fromHash} network={fromNetwork} className="">
          <Button size="small" className="text-xs">
            {t('Txhash')}
          </Button>
        </SubscanLink>
      </StepWrapper>

      {hasRelay && (
        <StepWrapper
          icon={relayed ? stepRelayIcon : stepInactiveRelayIcon}
          className={relayed ? '' : 'text-gray-300'}
          title={t('ChainRelay Confirmed')}
        >
          {claim && relayed && (
            <Button disabled={!!tx} icon={tx ? <LoadingOutlined /> : null} onClick={() => claim()} size="small">
              {t(tx ? 'Claiming' : 'Claim')}
            </Button>
          )}
          {relayed && (
            <Tag color="success" icon={<CheckCircleOutlined />} className="flex items-center">
              {t('Claimed')}
            </Tag>
          )}
        </StepWrapper>
      )}

      <StepWrapper
        icon={txProgressIcon[iconName(toNetwork, true)]}
        title={t('{{chain}} Confirmed', { chain: toNetwork })}
        className={needClaim ? '' : 'text-gray-300'}
      >
        {/* eslint-disable-next-line no-magic-numbers */}
        {needClaim && toHash && (
          <SubscanLink txHash={toHash} network={toNetwork as Network}>
            <Button size="small" className="text-xs">
              {t('Txhash')}
            </Button>
          </SubscanLink>
        )}
      </StepWrapper>
    </div>
  );
}
