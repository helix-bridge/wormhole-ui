import { useCallback } from 'react';
import { AvailableBalance, DarwiniaAsset, TokenChainInfo } from '../model';
import { getDarwiniaBalances } from '../utils';
import { useApi } from './api';

export const getChainInfo: (tokens: TokenChainInfo[], target: DarwiniaAsset) => TokenChainInfo | undefined = (
  tokens: TokenChainInfo[],
  target: DarwiniaAsset
) => {
  if (target) {
    return tokens.find((token) => token.symbol.toLowerCase().includes(target.toLowerCase()));
  }

  return;
};

export function useDarwiniaAvailableBalances() {
  const { api, chain } = useApi();
  const getBalances = useCallback<(acc: string) => Promise<AvailableBalance[]>>(
    async (account: string) => {
      if (!api) {
        return [];
      }

      const [ring, kton] = await getDarwiniaBalances(api, account);

      return [
        {
          max: ring,
          asset: DarwiniaAsset.ring,
          chainInfo: getChainInfo(chain.tokens, DarwiniaAsset.ring),
          checked: true,
        },
        {
          max: kton,
          asset: DarwiniaAsset.kton,
          chainInfo: getChainInfo(chain.tokens, DarwiniaAsset.kton),
        },
      ];
    },
    [api, chain.tokens]
  );

  return getBalances;
}
