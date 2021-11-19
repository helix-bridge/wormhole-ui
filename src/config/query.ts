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
      message_id
      request_transaction
      response_transaction
      sender
      result
      recipient
      token
      amount
      start_timestamp
      end_timestamp
    }
  }
`;

export const S2S_ISSUING_RECORDS_QUERY = `
  query s2sEvents($account: String!, $offset: Int!, $limit: Int!, $result: [Int!]) {
    s2sEvents(offset: $offset, first: $limit, filter: { sender: { equalTo: $account }, result: { in: $result } }, orderBy: START_TIMESTAMP_DESC) {
      totalCount
      nodes {
        id
        sender
        recipient
        result
        startTimestamp
        endTimestamp
        requestTxHash
        token
        responseTxHash
        amount
      }
    }
  }
`;

export const MMR_QUERY = `
  query nodeEntities($ids: [String!]) {
    nodeEntities(filter: { id: { in: $ids } }) {
      nodes {
        position
        hash
      }
    }
  }
`;
