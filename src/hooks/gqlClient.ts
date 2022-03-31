import { ClientContext } from 'graphql-hooks';
import { useContext } from 'react';

export const useGqlClient = () => useContext(ClientContext);
