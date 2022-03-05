export interface SimpleBlock {
  blockHash: string;
  extrinsicHash: string;
  // eslint-disable-next-line id-denylist
  number: number;
  specVersion: number;
}

export interface SubstrateDVM2SubstrateRecord {
  lane_id: string;
  nonce: string;
  request_transaction: string;
  response_transaction: string;
  sender: string;
  recipient: string;
  token: string;
  amount: string;
  // eslint-disable-next-line no-magic-numbers
  result: 0 | 1 | 2;
  start_timestamp: string;
  end_timestamp: string;
}

export interface Substrate2SubstrateDVMRecord {
  laneId: string;
  nonce: string;
  requestTxHash: string;
  responseTxHash: string;
  sender: string;
  recipient: string;
  token: string;
  amount: string;
  // eslint-disable-next-line no-magic-numbers
  result: 0 | 1 | 2;
  startTimestamp: string;
  endTimestamp: string;
}

export interface SubstrateDVM2SubstrateRecordsRes {
  burnRecordEntities: SubstrateDVM2SubstrateRecord[];
}

export interface SubstrateDVM2SubstrateRecordRes {
  burnRecordEntity: SubstrateDVM2SubstrateRecord;
}

export interface Substrate2SubstrateDVMRecordsRes {
  s2sEvents: {
    totalCount: number;
    nodes: (Substrate2SubstrateDVMRecord & { id: string })[];
  };
}
export interface Substrate2SubstrateDVMRecordRes {
  s2sEvent: Substrate2SubstrateDVMRecord;
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

export interface BridgeDispatchEventRes {
  bridgeDispatchEvent: BridgeDispatchEventRecord;
}
