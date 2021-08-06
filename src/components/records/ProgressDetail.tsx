import { Button, Row } from 'antd';
import { PropsWithChildren, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Network } from '../../model';
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

interface ProgressDetailProps {
  from: Network;
  to: Network;
  fromHash: string;
  toHash?: string;
  isRelayed?: boolean;
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
    <Row className={`step flex flex-col justify-around items-center h-36 ${className || ''}`}>
      <Row className="flex flex-col justify-center items-center">
        <img src={icon} className="w-4 md:w-10 mb-4" />
        <span className="capitalize">{title}</span>
      </Row>
      <Row style={{ minHeight: 24 }}>{children}</Row>
    </Row>
  );
};

// eslint-disable-next-line complexity
export function ProgressDetail({ from, to, fromHash, toHash, isRelayed = false }: ProgressDetailProps) {
  const { t } = useTranslation();
  // eslint-disable-next-line no-magic-numbers
  const step = isRelayed ? 3 : 4;
  const iconName = useCallback(
    (chain: string, byRelay = false) => {
      if (byRelay) {
        return `step${isRelayed ? 'Inactive' : ''}${textCase(chain, 'capitalize')}Icon` as TxIconName;
      } else {
        return `step${textCase(chain, 'capitalize')}Icon` as TxIconName;
      }
    },
    [isRelayed]
  );

  return (
    <div className={'grid bg-gray-700 bg-opacity-30 progress-steps ' + (isRelayed ? 'grid-cols-4' : 'grid-cols-3')}>
      <StepWrapper icon={stepStartIcon} title="Transaction Send"></StepWrapper>

      <StepWrapper icon={txProgressIcon[iconName(from)]} title={t('{{chain}} Confirmed', { chain: from })}>
        <SubscanLink txHash={fromHash} network={from} className="">
          <Button size="small" className="text-xs">
            {t('Txhash')}
          </Button>
        </SubscanLink>
      </StepWrapper>

      {isRelayed && <StepWrapper icon={stepRelayIcon} title={t('ChainRelay Confirmed')}></StepWrapper>}

      <StepWrapper
        icon={txProgressIcon[iconName(to, true)]}
        title={t('{{chain}} Confirmed', { chain: to })}
        className={isRelayed ? 'text-gray-300' : ''}
      >
        {/* eslint-disable-next-line no-magic-numbers */}
        {step >= 4 && toHash && (
          <SubscanLink txHash={toHash} network={to as Network}>
            <Button size="small" className="text-xs">
              {t('Txhash')}
            </Button>
          </SubscanLink>
        )}
      </StepWrapper>
    </div>
  );
}
