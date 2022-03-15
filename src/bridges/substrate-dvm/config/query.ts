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
          senderId: {
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
      recipientId
      senderId
      amount
      timestamp
      section
      method
      block
    }
  }
}
`;
