import { Observable } from 'rxjs';
import { Unit } from 'web3-utils';
import {
  CrossChainPayload,
  Darwinia2EthereumPayload,
  DVMPayload,
  Ethereum2DarwiniaPayload,
  Substrate2DVMPayload,
  Substrate2SubstrateDVMPayload,
} from './bridge';
import { DVMChainConfig, PolkadotChainConfig } from './network';
import { DeepRequired } from './type-operator';

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
  error?: Error;
}

export type TxFn<T> = (value: T) => Observable<Tx>;

export type TxConfirmComponentProps<T> = { value: CrossChainPayload<T>; unit?: Unit };

export type TxHashType = 'block' | 'extrinsic' | 'address' | 'txHash'; // consistent with the SubscanLink component props;

export type TxSuccessComponentProps<T> = {
  tx: Tx;
  value: CrossChainPayload<T>;
  hashType?: TxHashType;
  unit?: Unit;
};

/* -----------------------------------issuing and redeem----------------------------------------------*/

type CommonPayloadKeys = 'sender' | 'recipient' | 'amount' | 'asset';

// TODO: rename this types; suggestion: XxxxTxPayload
export type DVMToken = CrossChainPayload<DeepRequired<DVMPayload, [CommonPayloadKeys]>>;

export type RedeemDVMToken = DVMToken;
export type IssuingDVMToken = DVMToken;

export type RedeemDarwiniaToken = CrossChainPayload<DeepRequired<Ethereum2DarwiniaPayload, [CommonPayloadKeys]>>;

export type RedeemDeposit = CrossChainPayload<
  DeepRequired<Ethereum2DarwiniaPayload, ['sender' | 'deposit' | 'recipient']>
>;

export type IssuingDarwiniaToken = CrossChainPayload<
  DeepRequired<Darwinia2EthereumPayload, ['sender' | 'assets' | 'recipient']>
>;

export type IssuingSubstrateToken = CrossChainPayload<DeepRequired<Substrate2SubstrateDVMPayload, [CommonPayloadKeys]>>;

export type SmartTxPayload<F extends PolkadotChainConfig = PolkadotChainConfig> = CrossChainPayload<
  DeepRequired<Substrate2DVMPayload, [CommonPayloadKeys]>,
  F,
  F extends DVMChainConfig ? PolkadotChainConfig : DVMChainConfig
>;
