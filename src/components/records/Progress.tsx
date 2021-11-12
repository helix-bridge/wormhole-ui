import { CheckCircleOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Row, Tooltip } from 'antd';
import { last } from 'lodash';
import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ChainConfig, Network } from '../../model';
import { CrabIcon, DarwiniaIcon, EthereumIcon, PangolinIcon, PangoroIcon, RopstentIcon, TxSendIcon } from '../icons';
import { TronIcon } from '../icons/tron';
import { SubscanLink } from '../SubscanLink';

export enum State {
  pending = 0,
  completed,
  error,
}

const stateColors: string[] = ['#4b5563', '#5745de', '#da1737'];

interface Step {
  name: string;
  state: State;
  tx?: string;
  mutateState?: () => void;
}

type IconComponent = (props: { className: string; style: React.CSSProperties }) => JSX.Element;

export interface ProgressProps {
  steps: Step[];
  Icon: IconComponent;
  title: React.ReactNode;
  className?: string;
  network: ChainConfig | null;
}

export interface ProgressesProps {
  items: ProgressProps[];
}

export const transactionSend: ProgressProps = {
  title: <Trans>Transaction Send</Trans>,
  Icon: TxSendIcon,
  steps: [{ name: '', state: State.completed }],
  network: null,
};

export const iconsMap: Record<Network, IconComponent> = {
  pangoro: PangoroIcon,
  pangolin: PangolinIcon,
  darwinia: DarwiniaIcon,
  ropsten: RopstentIcon,
  ethereum: EthereumIcon,
  crab: CrabIcon,
  tron: TronIcon,
};

/**
 * @description Each progress could includes multi steps. e.g. s2s origin chain: lock -> confirm
 * progress state depend on every step state
 * - every steps completed, progress completed
 * - if one of the steps error, progress  error
 * - if no error and the last step is no completed, progress pending
 */
function Progress({ steps, Icon, title, className = '', network }: ProgressProps) {
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

  return (
    <Row
      className={`step flex flex-col justify-around items-center h-36 text-center text-xs md:text-base after:bg-white dark:after:bg-gray-800 dark:after:bg-opacity-20 ${className}`}
    >
      <Row className="flex flex-col justify-center items-center">
        <Icon className="w-4 md:w-10 rounded-full overflow-hidden" style={{ color: stateColors[progressItemState] }} />
        <span className="capitalize mt-4 dark:text-gray-200 text-gray-900">{title}</span>
      </Row>
      <Row style={{ minHeight: 24 }}>{finish || action}</Row>
    </Row>
  );
}

export function Progresses({ items }: ProgressesProps) {
  const cols = useMemo(() => items.length, [items.length]);

  return (
    <div className={`grid bg-gray-800 bg-opacity-20 progress-steps grid-cols-${cols}`}>
      {items.map((item, index) => (
        <Progress {...item} key={index} />
      ))}
    </div>
  );
}
