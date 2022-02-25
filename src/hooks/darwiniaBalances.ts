import { useCallback } from 'react';
import { AvailableBalance, DarwiniaAsset, Token } from '../model';
import { getDarwiniaBalances } from '../utils';
import { useApi } from './api';

export const getToken: (tokens: Token[], target: DarwiniaAsset) => Token = (tokens, target) => {
  const result = tokens.find((token) => token.symbol.toLowerCase().includes(target.toLowerCase()));
  const unknown: Token = { symbol: 'unknown', decimal: 'gwei' };

  return result || unknown;
};

export function useDarwiniaAvailableBalances() {
  const { api, chain, network } = useApi();
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
          checked: true,
          token: getToken(chain.tokens, network?.name === 'crab' ? DarwiniaAsset.crab : DarwiniaAsset.ring),
        },
        {
          max: kton,
          asset: DarwiniaAsset.kton,
          token: getToken(chain.tokens, DarwiniaAsset.kton),
        },
      ];
    },
    [api, chain.tokens, network?.name]
  );

  return getBalances;
}
