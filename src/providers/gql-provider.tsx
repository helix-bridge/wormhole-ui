import { ClientContext, GraphQLClient } from 'graphql-hooks';
import { useMemo } from 'react';

const isDev = process.env.REACT_APP_HOST_TYPE === 'dev';

export const GqlProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const value = useMemo(
    () =>
      new GraphQLClient({
        url: isDev ? 'http://localhost:4000/' : '',
      }),
    []
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};
