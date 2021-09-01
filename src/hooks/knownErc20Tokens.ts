import { useCallback, useEffect, useReducer, useState } from 'react';
import { RegisterStatus } from '../config';
import { Action, Erc20RegisterStatus, Erc20Token, Network, RequiredPartial } from '../model';
import { getTokenBalance } from '../utils/erc20/meta';
import { getKnownErc20Tokens, StoredProof } from '../utils/erc20/token';
import { useApi } from './api';

export type MemoedTokenInfo = RequiredPartial<Erc20Token, 'name' | 'logo' | 'decimals' | 'address' | 'symbol'>;

export type ActionType = 'updateTokens' | 'updateProof' | 'switchToConfirmed';

interface State {
  tokens: MemoedTokenInfo[];
  proofs: StoredProof[];
}

const initialState: State = {
  tokens: [],
  proofs: [],
};

function reducer(state = initialState, action: Action<ActionType, MemoedTokenInfo[] | StoredProof | string>) {
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
    default:
      return state;
  }
}

/**
 *
 * @params {string} networkType
 * @params {number} status - token register status 1:registered 2:registering
 */
export const useKnownErc20Tokens = (network: Network, status: Erc20RegisterStatus = RegisterStatus.unregister) => {
  const [loading, setLoading] = useState(true);
  const [state, dispatch] = useReducer(reducer, initialState);
  const updateTokens = useCallback(
    (tokens: MemoedTokenInfo[]) => dispatch({ payload: tokens, type: 'updateTokens' }),
    []
  );
  const addKnownProof = useCallback((proofs: StoredProof) => dispatch({ payload: proofs, type: 'updateProof' }), []);
  const switchToConfirmed = useCallback((token: string) => dispatch({ payload: token, type: 'switchToConfirmed' }), []);
  const {
    connection: { accounts },
  } = useApi();
  const { address: currentAccount } = (accounts || [])[0] ?? '';
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
    (async () => {
      setLoading(true);

      try {
        const all = (await getKnownErc20Tokens(currentAccount, network)) as Erc20Token[];
        const tokens = status > 0 ? all.filter((item) => item.status && +item.status === status) : all;

        updateTokens(tokens);
      } catch (error) {
        console.warn(
          '%c [ error in useAllToken hook ]-56',
          'font-size:13px; background:pink; color:#bf2c9f;',
          error.message
        );
      }

      setLoading(false);
    })();
  }, [currentAccount, network, updateTokens, status]);

  return {
    ...state,
    loading,
    updateTokens,
    addKnownProof,
    switchToConfirmed,
    refreshTokenBalance,
  };
};
