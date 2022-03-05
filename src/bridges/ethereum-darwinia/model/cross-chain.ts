import { Unit } from 'web3-utils';
import { CommonPayloadKeys, DarwiniaAsset, DeepRequired, Deposit } from '../../../model';
import { CrossChainAsset, CrossChainParty, CrossChainPayload } from '../../../model/bridge';

export type IssuingDarwiniaTxPayload = CrossChainPayload<
  DeepRequired<Darwinia2EthereumPayload, ['sender' | 'assets' | 'recipient']>
>;

export type RedeemDarwiniaTxPayload = CrossChainPayload<DeepRequired<Ethereum2DarwiniaPayload, [CommonPayloadKeys]>>;

export type RedeemDepositTxPayload = CrossChainPayload<
  DeepRequired<Ethereum2DarwiniaPayload, ['sender' | 'deposit' | 'recipient']>
>;

export interface Ethereum2DarwiniaPayload extends CrossChainParty, CrossChainAsset {
  deposit?: Deposit;
}

export interface Darwinia2EthereumPayload extends CrossChainParty {
  assets: (CrossChainAsset<DarwiniaAsset> & { checked?: boolean; unit?: Unit })[];
}
