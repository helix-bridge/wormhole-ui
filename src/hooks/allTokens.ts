import { useEffect, useState } from 'react';
import { RegisterStatus } from '../config';
import { Erc20RegisterStatus, Erc20Token, Network, RequiredPartial } from '../model';
import { getAllTokens } from '../utils/erc20/token';
import { useApi } from './api';
import { useCancelablePromise } from './cancelablePromise';

/**
 *
 * @params {string} networkType
 * @params {number} status - token register status 1:registered 2:registering
 */
export const useAllTokens = (network: Network, status: Erc20RegisterStatus = RegisterStatus.unregister) => {
  const [loading, setLoading] = useState(true);
  const [allTokens, setAllTokens] = useState<
    RequiredPartial<Erc20Token, 'name' | 'logo' | 'decimals' | 'address' | 'symbol'>[]
  >([]);
  const makeCancelable = useCancelablePromise();
  const { accounts } = useApi();
  const { address: currentAccount } = (accounts || [])[0] ?? '';

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const all = (await makeCancelable(getAllTokens(currentAccount, network))) as Erc20Token[];
        const tokens = status > 0 ? all.filter((item) => +item.status === status) : all;

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
  }, [currentAccount, makeCancelable, network, status]);

  return { loading, allTokens, setAllTokens };
};
