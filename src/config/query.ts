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
      transaction
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

export const S2S_ISSUING_LOCKED_RECORDS_QUERY = `
  query transfers($account: String!, $offset: Int!, $limit: Int!) {
    transfers(offset: $offset, last: $limit, filter: { fromId: { equalTo: $account } }, orderBy: TIMESTAMP_DESC) {
      totalCount
      nodes {
        fromId
        toId
        block {
          events(filter: { method: { equalTo: "TokenLocked" }}) {
            nodes {
              data
              timestamp
              extrinsic {
                id
              }
            }
          }
        }
      }
    } 
  }
`;

export const S2S_ISSUING_CONFIRMED_RECORDS_QUERY = `
  query transfers($account: String!, $offset: Int!, $limit: Int!) {
    transfers(offset: $offset, last: $limit, filter: { fromId: { equalTo: $account } }, orderBy: TIMESTAMP_DESC) {
      totalCount
      nodes {
        fromId
        toId
        block {
          events(filter: { method: { equalTo: "TokenLockedConfirmed" }}) {
            nodes {
              data
              timestamp
              extrinsic {
                id
              }
            }
          }
        }
      }
    } 
  }
`;
