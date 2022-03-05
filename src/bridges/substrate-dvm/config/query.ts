/**
 * subql
 */
export const TRANSFERS_QUERY = `
 query transfers($account: String!, $offset: Int, $limit: Int) {
   transfers(
     offset: $offset,
     last: $limit,
     filter: {
       or: [ 
         { fromId: { equalTo: $account } },
         { toId: { equalTo: $account } }
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
       tokenId
       fee
       block
     }
   }
 }
`;
