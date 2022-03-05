/**
 * subql subql-darwinia-mmr subql-pangolin-mmr
 */
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
