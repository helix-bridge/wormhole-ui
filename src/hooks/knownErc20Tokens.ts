import { useCallback, useEffect, useState } from 'react';
import { RegisterStatus } from '../config';
import { Erc20RegisterStatus, Erc20Token, Network, RequiredPartial } from '../model';
import { getKnownErc20Tokens, StoredProof } from '../utils/erc20/token';
import { getTokenBalance } from '../utils/erc20/meta';
import { useApi } from './api';

export type MemoedTokenInfo = RequiredPartial<Erc20Token, 'name' | 'logo' | 'decimals' | 'address' | 'symbol'> & {
  proof?: StoredProof;
  confirmed?: 0 | 1;
};

/**
 *
 * @params {string} networkType
 * @params {number} status - token register status 1:registered 2:registering
 */
export const useKnownErc20Tokens = (network: Network, status: Erc20RegisterStatus = RegisterStatus.unregister) => {
  const [loading, setLoading] = useState(true);
  const [allTokens, setAllTokens] = useState<MemoedTokenInfo[]>([]);
  const { accounts } = useApi();
  const { address: currentAccount } = (accounts || [])[0] ?? '';
  const refreshTokenBalance = useCallback(
    async (tokenAddress: string) => {
      const balance = await getTokenBalance(tokenAddress, currentAccount, true);
      const tokens = [...allTokens];
      const index = tokens.findIndex((item) => item.address === tokenAddress);

      if (index > 0) {
        tokens[index].balance = balance;
        setAllTokens(tokens);
      }
    },
    [allTokens, currentAccount]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const all = (await getKnownErc20Tokens(currentAccount, network)) as Erc20Token[];
        const tokens = status > 0 ? all.filter((item) => item.status && +item.status === status) : all;

        setAllTokens(tokens);
      } catch (error) {
        console.info(
          '%c [ error in useAllToken hook ]-56',
          'font-size:13px; background:pink; color:#bf2c9f;',
          error.message
        );
      }

      setLoading(false);
    })();
  }, [currentAccount, network, status]);

  return { loading, allTokens, setAllTokens, refreshTokenBalance };
};
