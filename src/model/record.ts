interface SimpleBlock {
  blockHash: string;
  extrinsicHash: string;
  // eslint-disable-next-line id-denylist
  number: number;
  specVersion: number;
}

export interface BridgeDispatchEventRecord {
  data: string; // json string [ChainId, [LaneId, MessageNonce], DispatchResult]
  isSuccess: boolean;
  method:
    | 'MessageRejected'
    | 'MessageVersionSpecMismatch'
    | 'MessageWeightMismatch'
    | 'MessageSignatureMismatch'
    | 'MessageCallDecodeFailed'
    | 'MessageCallRejected'
    | 'MessageDispatchPaymentFailed'
    | 'MessageDispatched';
  block: SimpleBlock;
  index: number;
}
