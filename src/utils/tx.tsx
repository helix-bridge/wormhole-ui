import { Modal, ModalFuncProps, ModalProps } from 'antd';
import { Trans } from 'react-i18next';
import { Observer, switchMap, tap } from 'rxjs';
import { finalize } from 'rxjs';
import { EMPTY } from 'rxjs';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../config';
import { E2D, RequiredPartial, TransferFormValues, Tx, TxFn } from '../model';
import { empty } from './helper';

/**
 * TODO: web3 types
 */
export interface Receipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  contractAddress: string;
  cumulativeGasUsed: number;
  gasUsed: number;
}

type ModalSpyFn = (observer: Observer<boolean>) => void;

type IModalFuncs = {
  afterDisappear?: ModalSpyFn;
  handleOk?: ModalSpyFn;
  handleCancel?: ModalSpyFn;
};

export const txModalConfig: (props: Partial<ModalFuncProps>) => ModalProps = (props) => ({
  okCancel: true,
  cancelText: <Trans>Cancel</Trans>,
  okText: <Trans>Confirm</Trans>,
  okButtonProps: { size: 'large' },
  cancelButtonProps: { size: 'large' },
  width: 520,
  centered: true,
  className: 'confirm-modal',
  icon: null,
  destroyOnClose: true,
  ...props,
});

const { confirm } = Modal;

export function applyModal(props: RequiredPartial<ModalFuncProps, 'content'> & IModalFuncs): { destroy: () => void } {
  const config = txModalConfig(props);

  return confirm(config);
}

export function applyModalObs(props: RequiredPartial<ModalFuncProps, 'content'> & IModalFuncs): Observable<boolean> {
  const config = txModalConfig(props);
  const { afterClose, ...others } = config;

  return new Observable((observer) => {
    confirm({
      ...others,
      onCancel: (close) => {
        observer.next(false);
        close();
      },
      onOk: (close) => {
        observer.next(true);
        close();
      },
      afterClose: () => {
        if (afterClose) {
          afterClose();
        }
      },
    });
  });
}

export const approveRingToIssuing: TxFn<RequiredPartial<TransferFormValues<E2D>, 'sender' | 'transfer'>> = ({
  sender,
  transfer,
}) => {
  return new Observable((observer) => {
    try {
      const web3js = new Web3(window.ethereum || window.web3.currentProvider);
      const contract = new web3js.eth.Contract(abi.tokenABI, transfer.from?.tokenContract.ring);
      const hardCodeAmount = '100000000000000000000000000';
      observer.next({ status: 'signing' });

      contract.methods
        .approve(transfer.from?.tokenContract.issuingDarwinia, Web3.utils.toWei(hardCodeAmount))
        .send({ from: sender })
        .on('transactionHash', (hash: string) => {
          observer.next({ status: 'queued', hash });
        })
        .on('receipt', ({ transactionHash }: Receipt) => {
          observer.next({ status: 'finalized', hash: transactionHash });
          observer.complete();
        })
        .catch((error: { code: number; message: string }) => {
          observer.error({ status: 'error', error: error.message });
        });
    } catch (_) {
      observer.error({ status: 'error', error: 'Contract construction/call failed!' });
    }
  });
};

export type AfterTxCreator = (tx: Tx) => () => void;

export function createTxObs(before: Observable<boolean>, txObs: Observable<Tx>, after: AfterTxCreator): Observable<Tx> {
  let finish: () => void = empty;

  return before.pipe(
    switchMap((confirmed) =>
      confirmed
        ? txObs.pipe(
            tap((tx) => {
              if (tx.status === 'finalized') {
                finish = after(tx);
              }
            }),
            finalize(() => finish())
          )
        : EMPTY
    )
  );
}
