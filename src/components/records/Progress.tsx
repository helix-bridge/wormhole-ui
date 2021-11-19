import { CheckCircleOutlined, CheckOutlined, ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Button, Row, Tooltip } from 'antd';
import { last } from 'lodash';
import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ChainConfig } from '../../model';
import { isEthereumNetwork, isPolkadotNetwork } from '../../utils';
import { SubscanLink } from '../SubscanLink';

export enum State {
  pending = 0,
  completed,
  error,
}

// const stateColors: string[] = ['#4b5563', '#5745de', '#da1737'];

interface Step {
  name: string;
  state: State;
  tx?: string;
  mutateState?: () => void;
}

export interface ProgressProps {
  className?: string;
  icon?: string; // svg image
  network: ChainConfig | null;
  steps: Step[];
  title: React.ReactNode;
}

export interface ProgressesProps {
  items: ProgressProps[];
}

export const transactionSend: ProgressProps = {
  title: <Trans>Source-chain Sent</Trans>,
  steps: [{ name: '', state: State.completed }],
  network: null,
};

/**
 * @description Each progress could includes multi steps. e.g. s2s origin chain: lock -> confirm
 * progress state depend on every step state
 * - every steps completed, progress completed
 * - if one of the steps error, progress  error
 * - if no error and the last step is no completed, progress pending
 */
// eslint-disable-next-line complexity
function Progress({ steps, title, icon, className = '', network }: ProgressProps) {
  const { t } = useTranslation();
  const {
    tx,
    mutateState,
    state: lastState,
  } = useMemo<Step>(() => last(steps) ?? { name: '', state: State.completed }, [steps]);
  const progressItemState = useMemo<State>(() => {
    if (steps.some((item) => item.state === State.error)) {
      return State.error;
    } else if (steps.every((item) => item.state === State.completed)) {
      return State.completed;
    } else {
      return State.pending;
    }
  }, [steps]);
  const finish = useMemo(() => {
    if (progressItemState !== State.pending && tx && network) {
      return (
        <SubscanLink txHash={tx} network={network.name}>
          <Button size="small" className="text-xs" icon={<CheckOutlined />}>
            {t('Txhash')}
          </Button>
        </SubscanLink>
      );
    }

    return null;
  }, [network, progressItemState, t, tx]);

  const action = useMemo(() => {
    if (mutateState) {
      return (
        <Button
          disabled={!!tx}
          icon={tx ? <LoadingOutlined /> : null}
          onClick={() => {
            if (mutateState) {
              mutateState();
            }
          }}
          size="small"
        >
          {tx ? (
            t('Claiming')
          ) : (
            <Tooltip title={t('Each claim transaction of Ethereum is estimated to use 600,000 Gas.')}>
              {t('Claim')}
            </Tooltip>
          )}
        </Button>
      );
    }

    if (lastState === State.completed) {
      return <CheckCircleOutlined className="text-xl text-green-500" />;
    }

    return null;
  }, [mutateState, lastState, t, tx]);
  const iconColorCls = useMemo(() => {
    if (isEthereumNetwork(network?.name)) {
      return 'text-gray-700';
    }

    if (isPolkadotNetwork(network?.name)) {
      return `bg-${network?.name}`;
    }

    return `bg-pangolin`;
  }, [network]);

  return (
    <Row
      className={`step flex flex-col justify-around items-center h-36 text-center text-xs md:text-base after:bg-pangolin ${className}`}
    >
      <Row
        className={`flex flex-col justify-center items-center ${
          progressItemState === State.pending && !isEthereumNetwork(network?.name) ? 'opacity-30' : 'opacity-100'
        }`}
      >
        <div className="relative">
          {/* Jagged when adding backgrounds to svg containers, so use image here */}
          <img
            src={`/image/${icon ?? network?.name + '.png'}`}
            className={` w-4 md:w-10 rounded-full overflow-hidden ${iconColorCls} `}
          />
          {progressItemState === State.error && (
            <ExclamationCircleFilled className="absolute -top-1 -right-1 text-red-500 text-xs" />
          )}
        </div>
        <span className="capitalize mt-4 dark:text-gray-200 text-gray-900">{title}</span>
      </Row>
      <Row style={{ minHeight: 24 }}>{finish || action}</Row>
    </Row>
  );
}

export function Progresses({ items }: ProgressesProps) {
  const cols = useMemo(() => items.length, [items.length]);

  return (
    <div className={`grid bg-gray-300 dark:bg-gray-800 bg-opacity-20 progress-steps grid-cols-${cols}`}>
      {items.map((item, index) => (
        <Progress {...item} key={index} />
      ))}
    </div>
  );
}
