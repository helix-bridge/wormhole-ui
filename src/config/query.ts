export const TRANSFERS_COUNT_QUERY = `
  query transfers($account: String!) {
    transfers(filter: { fromId: { equalTo: $account } }) {
      totalCount
    }
  }
`;
export const TRANSFERS_QUERY = `
  query transfers($account: String!, $offset: Int, $limit: Int) {
    transfers(offset: $offset, last: $limit, filter: { fromId: { equalTo: $account } }, orderBy: TIMESTAMP_DESC) {
      totalCount
      nodes {
        toId
        fromId
        amount
        timestamp

        block {
          id
          extrinsics {
            nodes {
              id
              method
              section
              args
              signerId # 验证人account
              isSuccess
            }
          }
        }
      }
    }
  }
`;

export const S2S_REDEEM_RECORDS_QUERY = `
  query burnRecordEntities($account: String!, $offset: Int, $limit: Int, $result: [Int!] ) {
    burnRecordEntities(
      skip: $offset,
      first: $limit,
      where: { 
        sender: $account,
        result_in: $result
      }, 
      orderBy: start_timestamp,
      orderDirection: desc
    ){
      amount
      end_timestamp
      message_id
      recipient
      request_transaction
      response_transaction
      result
      sender
      start_timestamp
      token
    }
  }
`;

export const S2S_REDEEM_RECORD_QUERY = `
  query burnRecordEntity($id: String!) {
    burnRecordEntity(id: $id) {
      amount
      end_timestamp     
      message_id
      recipient
      request_transaction
      response_transaction
      result
      sender
      start_timestamp
      token
    }
  }
`;

export const S2S_ISSUING_RECORDS_QUERY = `
  query s2sEvents($account: String!, $offset: Int!, $limit: Int!, $result: [Int!]) {
    s2sEvents(offset: $offset, first: $limit, filter: { sender: { equalTo: $account }, result: { in: $result } }, orderBy: START_TIMESTAMP_DESC) {
      totalCount
      nodes {
        amount
        endTimestamp
        id
        recipient
        requestTxHash
        responseTxHash
        result
        sender
        startTimestamp
        token
      }
    }
  }
`;

export const S2S_UNLOCK_RECORD_QUERY = `
  query s2sEvent($id: String!) {
    s2sEvent(id: $id) {
      amount
      endTimestamp
      id
      recipient
      requestTxHash
      responseTxHash
      result
      sender
      startTimestamp
      token
    }
  }
`;

export const S2S_ISSUING_MAPPING_RECORD_QUERY = `
  query lockRecordEntity($id: String!) {
    lockRecordEntity(id: $id) {
      amount
      mapping_token
      recipient
      transaction
    }
  }
`;

export const MMR_QUERY = `
  query nodeEntities($ids: [String!]) {
    nodeEntities(filter: { id: { in: $ids } }) {
      nodes {
        id
        hash
      }
    }
  }
`;
