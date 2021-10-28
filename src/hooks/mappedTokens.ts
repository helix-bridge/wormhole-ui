import { message } from 'antd';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { from as fromPromise, map, of, switchMap, tap } from 'rxjs';
import { RegisterStatus } from '../config';
import {
  Action,
  Erc20RegisterStatus,
  Erc20Token,
  EthereumConnection,
  RequiredPartial,
  TransferNetwork,
} from '../model';
import { isNetworkConsistent } from '../utils';
import { getTokenBalance } from '../utils/erc20/meta';
import { getKnownMappedTokens, StoredProof } from '../utils/erc20/token';
import { useApi } from './api';

export type MemoedTokenInfo = RequiredPartial<Erc20Token, 'name' | 'logo' | 'decimals' | 'address' | 'symbol'>;

export type ActionType = 'updateTokens' | 'updateProof' | 'switchToConfirmed' | 'updateTotal';

interface State {
  tokens: MemoedTokenInfo[];
  proofs: StoredProof[];
  total: number;
}

const initialState: State = {
  tokens: [],
  proofs: [],
  total: 0,
};

// eslint-disable-next-line complexity
function reducer(state = initialState, action: Action<ActionType, MemoedTokenInfo[] | StoredProof | string | number>) {
  switch (action.type) {
    case 'updateTokens':
      return { ...state, tokens: action.payload as MemoedTokenInfo[] };
    case 'updateProof':
      return { ...state, proofs: [...state.proofs, action.payload as StoredProof] };
    case 'switchToConfirmed': {
      const address = action.payload as string;
      const index = state.tokens.findIndex((item) => item.address === address);
      const data = [...state.tokens];

      if (index > -1) {
        data[index].status = RegisterStatus.registered;
      }
      return { ...state, tokens: data };
    }
    case 'updateTotal':
      return { ...state, total: +action.payload as number };
    default:
      return state;
  }
}

/**
 *
 * @params {string} networkType
 * @params {number} status - token register status 1:registered 2:registering
 */
export const useMappedTokens = (
  { from, to }: TransferNetwork,
  status: Erc20RegisterStatus = RegisterStatus.unregister
) => {
  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const updateTokens = useCallback(
    (tokens: MemoedTokenInfo[]) => dispatch({ payload: tokens, type: 'updateTokens' }),
    []
  );
  const updateTotal = useCallback((total: number) => dispatch({ payload: total, type: 'updateTotal' }), []);
  const addKnownProof = useCallback((proofs: StoredProof) => dispatch({ payload: proofs, type: 'updateProof' }), []);
  const switchToConfirmed = useCallback((token: string) => dispatch({ payload: token, type: 'switchToConfirmed' }), []);
  const { connection } = useApi();
  const { address: currentAccount } = useMemo(() => (connection.accounts || [])[0] ?? '', [connection.accounts]);
  const refreshTokenBalance = useCallback(
    async (tokenAddress: string) => {
      const balance = await getTokenBalance(tokenAddress, currentAccount, true);
      const tokens = [...state.tokens];
      const index = tokens.findIndex((item) => item.address === tokenAddress);

      if (index > 0) {
        tokens[index].balance = balance;
        updateTokens(tokens);
      }
    },
    [currentAccount, updateTokens, state.tokens]
  );

  useEffect(() => {
    if (connection.type !== 'metamask' || !from || !to) {
      updateTokens([]);
      return;
    }

    const subscription = fromPromise(isNetworkConsistent(from!.name, (connection as EthereumConnection).chainId))
      .pipe(
        tap(() => setLoading(true)),
        switchMap((isMatch) => {
          if (!isMatch) {
            return of({ total: 0, tokens: [] });
          }

          return getKnownMappedTokens(currentAccount, from, to).pipe(
            map(({ tokens, total }) => ({
              total,
              tokens: status > 0 ? tokens.filter((item) => item.status && +item.status === status) : tokens,
            }))
          );
        })
      )
      .subscribe({
        next: ({ tokens, total }) => {
          updateTokens(tokens);
          updateTotal(total);
        },
        error: (error) => {
          message.error('Querying failed, please try it again later');
          console.warn('%c [ query mapping token error ]', 'font-size:13px; background:pink; color:#bf2c9f;', error);
          setLoading(false);
        },
        complete: () => setLoading(false),
      });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [currentAccount, from, updateTokens, status, connection, to, updateTotal]);

  return {
    ...state,
    loading,
    updateTokens,
    addKnownProof,
    switchToConfirmed,
    refreshTokenBalance,
  };
};
