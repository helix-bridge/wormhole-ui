import { ModalProps } from 'antd';
import { FunctionComponent, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Path } from '../config/routes';
import { NoNullTransferNetwork, TransferFormValues, Tx, TxHashType, TxSuccessComponentProps } from '../model';
import { TxContext, TxCtx } from '../providers';
import { applyModal, genHistoryRouteParams, getNetworkMode } from '../utils';

export const useTx = () => useContext(TxContext) as Exclude<TxCtx, null>;

export function useAfterSuccess<
  T extends TransferFormValues<{ sender: string; recipient?: string }, NoNullTransferNetwork>
>() {
  const { t } = useTranslation();
  const history = useHistory();

  const afterTx = useCallback(
    (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Comp: FunctionComponent<TxSuccessComponentProps<TransferFormValues<any, NoNullTransferNetwork>>>,
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
                Path.history +
                  '?' +
                  genHistoryRouteParams({
                    from: value.transfer.from.name,
                    sender: value.sender,
                    to: value.transfer.to.name,
                    fMode: getNetworkMode(value.transfer.from),
                    tMode: getNetworkMode(value.transfer.to),
                  })
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
