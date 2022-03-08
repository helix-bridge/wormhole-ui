import {
  CommonPayloadKeys,
  CrossChainAsset,
  CrossChainParty,
  CrossChainPayload,
  DeepRequired,
  MappingToken,
} from '../../../model';

export interface Erc20Payload extends CrossChainParty, CrossChainAsset<MappingToken> {}

export type Erc20TxPayload = CrossChainPayload<DeepRequired<Erc20Payload, [CommonPayloadKeys]>>;
