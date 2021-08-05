import { ModalProps } from 'antd';
import { FunctionComponent, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Path } from '../config/routes';
import {
  Bridges,
  DeepRequired,
  NoNullTransferNetwork,
  TransferFormValues,
  Tx,
  TxHashType,
  TxSuccessComponentProps,
} from '../model';
import { TxContext, TxCtx } from '../providers';
import { applyModal, genHistoryRouteParams } from '../utils';

export const useTx = () => useContext(TxContext) as Exclude<TxCtx, null>;

export function useAfterSuccess<
  T extends TransferFormValues<DeepRequired<Bridges, ['sender']>, NoNullTransferNetwork>
>() {
  const { t } = useTranslation();
  const history = useHistory();

  const afterTx = useCallback(
    (
        Comp: FunctionComponent<TxSuccessComponentProps>,
        {
          onDisappear,
          hashType = 'txHash',
        }: Exclude<ModalProps, 'onCancel'> & {
          onDisappear: (value: T, tx: Tx) => void;
          hashType?: TxHashType;
        }
      ) =>
      (value: T) =>
      (tx: Tx) =>
      () => {
        const { destroy } = applyModal({
          content: <Comp tx={tx} value={value} hashType={hashType} />,
          okText: t('Cross-chain history'),
          okButtonProps: {
            size: 'large',
            onClick: () => {
              destroy();
              history.push(
                Path.history + '?' + genHistoryRouteParams({ network: value.transfer.from.name, sender: value.sender })
              );
            },
          },
          onCancel: (close) => {
            onDisappear(value, tx);
            close();
          },
        });
      },
    [history, t]
  );

  return { afterTx };
}
