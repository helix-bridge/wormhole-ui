import { CommonPayloadKeys, DeepRequired, MappedToken } from '../../../model';
import { CrossChainAsset, CrossChainParty, CrossChainPayload } from '../../../model/bridge';

export type SubstrateAsset = string | MappedToken;

export interface Substrate2SubstrateDVMPayload extends CrossChainParty, CrossChainAsset<SubstrateAsset> {}

export type IssuingSubstrateTxPayload = CrossChainPayload<
  DeepRequired<Substrate2SubstrateDVMPayload, [CommonPayloadKeys]>
>;
