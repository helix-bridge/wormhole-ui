import { ModalProps } from 'antd';
import { FunctionComponent, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Path } from '../config/routes';
import { E2D, NoNullTransferNetwork, RequiredPartial, TransferFormValues, Tx, TxSuccessComponentProps } from '../model';
import { TxContext, TxCtx } from '../providers';
import { applyModal, RedeemEth } from '../utils';

export const useTx = () => useContext(TxContext) as Exclude<TxCtx, null>;

type ApproveValue = TransferFormValues<RequiredPartial<E2D, 'sender'>, NoNullTransferNetwork>;

export function useAfterSuccess() {
  const { t } = useTranslation();
  const history = useHistory();

  const afterTx = useCallback(
    (
        Comp: FunctionComponent<TxSuccessComponentProps>,
        {
          onDisappear,
        }: Exclude<ModalProps, 'onCancel'> & {
          onDisappear: (value: RedeemEth | ApproveValue, tx: Tx) => void;
        }
      ) =>
      (value: RedeemEth | ApproveValue) =>
      (tx: Tx) =>
      () => {
        const { destroy } = applyModal({
          content: <Comp tx={tx} value={value} />,
          okText: t('Cross-chain history'),
          okButtonProps: {
            size: 'large',
            onClick: () => {
              destroy();
              history.push(Path.history);
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
