/**
 * subql
 */
export const TRANSFERS_QUERY = `
query transfers($account: String!, $method: String!, $offset: Int, $limit: Int) {
  transfers(
    offset: $offset,
    first: $limit,
    filter: {
      and: [
        {
          fromId: {
            equalTo: $account
          }
        },
        { method: { equalTo: $method } }
      ]
    },
    orderBy: TIMESTAMP_DESC
  ){
    totalCount
    nodes {
      toId
      fromId
      amount
      timestamp
      section
      method
      block
    }
  }
}
`;
