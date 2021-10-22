import { useCallback } from 'react';
import { AvailableBalance, TokenChainInfo } from '../model';
import { getDarwiniaAvailableBalances } from '../utils';
import { useApi } from './api';

export const getChainInfo: (tokens: TokenChainInfo[], target: string) => TokenChainInfo | undefined = (
  tokens: TokenChainInfo[],
  target: string
) => {
  if (target) {
    return tokens.find((token) => token.symbol.toLowerCase().includes(target.toLowerCase()));
  }
};

export function useDarwiniaAvailableBalances() {
  const { api, chain } = useApi();
  const getBalances = useCallback<(acc: string) => Promise<AvailableBalance[]>>(
    async (account: string) => {
      if (!api) {
        return [];
      }

      const [ring, kton] = await getDarwiniaAvailableBalances(api, account);

      return [
        {
          max: ring,
          asset: 'ring',
          chainInfo: getChainInfo(chain.tokens, 'ring'),
          checked: true,
        },
        {
          max: kton,
          asset: 'kton',
          chainInfo: getChainInfo(chain.tokens, 'kton'),
        },
      ];
    },
    [api, chain.tokens]
  );

  return getBalances;
}
