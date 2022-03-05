import { CommonPayloadKeys, DeepRequired, MappingToken } from '../../../model';
import { CrossChainAsset, CrossChainParty, CrossChainPayload } from '../../../model/bridge';

export interface Substrate2SubstrateDVMPayload extends CrossChainParty, CrossChainAsset<string> {}

export type IssuingSubstrateTxPayload = CrossChainPayload<
  DeepRequired<Substrate2SubstrateDVMPayload, [CommonPayloadKeys]>
>;

export interface SubstrateDVM2SubstratePayload extends CrossChainParty, CrossChainAsset<MappingToken> {}

export type RedeemSubstrateTxPayload = CrossChainPayload<
  DeepRequired<SubstrateDVM2SubstratePayload, [CommonPayloadKeys]>
>;
