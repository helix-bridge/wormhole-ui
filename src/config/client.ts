import { GraphQLClient } from 'graphql-hooks';

const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

export const client = new GraphQLClient({
  url: isDev ? 'http://localhost:4000/' : 'https://wormhole-apollo.darwinia.network/',
});
