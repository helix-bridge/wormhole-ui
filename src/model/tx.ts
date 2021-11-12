import { Observable } from 'rxjs';
import { DarwiniaConfig, EthereumConfig, PangolinConfig, RopstenConfig, CrabConfig } from './network';
import {
  Darwinia2EthereumTransfer,
  DVMTransfer,
  Ethereum2DarwiniaTransfer,
  NoNullTransferNetwork,
  Substrate2SubstrateDVMTransfer,
  TransferFormValues,
} from './transfer';
import { DeepRequired } from './util';

export type TxStatus =
  | 'future'
  | 'ready'
  | 'finalized'
  | 'finalitytimeout'
  | 'usurped'
  | 'dropped'
  | 'inblock'
  | 'invalid'
  | 'broadcast'
  | 'cancelled'
  | 'completed'
  | 'error'
  | 'incomplete'
  | 'queued'
  | 'qr'
  | 'retracted'
  | 'sending'
  | 'signing'
  | 'sent'
  | 'blocked';

export interface Tx {
  status: TxStatus;
  hash?: string;
  error?: string;
}

export type TxFn<T> = (value: T) => Observable<Tx>;

export type TxConfirmComponentProps<T> = { value: TransferFormValues<T, NoNullTransferNetwork> };

export type TxHashType = 'block' | 'extrinsic' | 'address' | 'txHash'; // consistent with the SubscanLink component props;

export type TxSuccessComponentProps<T> = {
  tx: Tx;
  value: TransferFormValues<T, NoNullTransferNetwork>;
  hashType?: TxHashType;
};

/* -----------------------------------issuing and redeem----------------------------------------------*/

export type DVMToken = TransferFormValues<
  DeepRequired<DVMTransfer, ['sender' | 'recipient' | 'amount' | 'asset']>,
  NoNullTransferNetwork<PangolinConfig | CrabConfig, RopstenConfig | EthereumConfig>
>;

export type RedeemDVMToken = DVMToken;
export type IssuingDVMToken = DVMToken;

export type RedeemDarwiniaToken = TransferFormValues<
  DeepRequired<Ethereum2DarwiniaTransfer, ['sender' | 'asset' | 'amount' | 'recipient']>,
  NoNullTransferNetwork<RopstenConfig | EthereumConfig, PangolinConfig | DarwiniaConfig>
>;

export type RedeemDeposit = TransferFormValues<
  DeepRequired<Ethereum2DarwiniaTransfer, ['sender' | 'deposit' | 'recipient']>,
  NoNullTransferNetwork<RopstenConfig | EthereumConfig, PangolinConfig | DarwiniaConfig>
>;

export type IssuingDarwiniaToken = TransferFormValues<
  DeepRequired<Darwinia2EthereumTransfer, ['sender' | 'assets' | 'recipient']>,
  NoNullTransferNetwork
>;

export type IssuingSubstrateToken = TransferFormValues<
  DeepRequired<Substrate2SubstrateDVMTransfer, ['sender' | 'asset' | 'amount' | 'recipient']>,
  NoNullTransferNetwork
>;
