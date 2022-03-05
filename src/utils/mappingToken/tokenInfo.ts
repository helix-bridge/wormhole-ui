import { AccountData, AccountInfo } from '@darwinia/types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import contractMap from '@metamask/contract-metadata';
import { ApiPromise } from '@polkadot/api';
import { memoize } from 'lodash';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { abi } from '../../config/abi';
import { entrance, waitUntilConnected } from '../network';

export interface TokenCache {
  address: string;
  symbol: string;
  decimals: string;
  name: string;
  logo: string;
  erc20?: boolean;
}

const DEFAULT_SYMBOL = '';
const DEFAULT_DECIMALS = '18';

async function getTokenMeta(tokenAddress: string, contractAbi: AbiItem[]): Promise<TokenCache> {
  if (contractMap[tokenAddress]) {
    return contractMap[tokenAddress];
  }

  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const contract = new web3.eth.Contract(contractAbi, tokenAddress);
  const symbol = await contract.methods.symbol().call();
  const decimals = await contract.methods.decimals().call();
  const name = await contract.methods.name().call();

  return {
    address: tokenAddress,
    symbol: symbol ?? DEFAULT_SYMBOL,
    decimals: decimals.toString() ?? DEFAULT_DECIMALS,
    name: name ?? '',
    logo: '',
  };
}

async function erc20Meta(tokenAddress: string): Promise<TokenCache> {
  return getTokenMeta(tokenAddress, abi.Erc20ABI);
}

async function mappedMeta(tokenAddress: string): Promise<TokenCache> {
  const { symbol, name, ...rest } = await getTokenMeta(tokenAddress, abi.tokenABI);

  return { ...rest, symbol: Web3.utils.hexToString(symbol), name: Web3.utils.hexToString(name) };
}

/**
 *
 * @param tokenAddress - token contract address
 * @param account - current active metamask account
 * @returns balance of the account
 */
export async function getTokenBalance(address: string, account: string, isErc20Native = true) {
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const tokenAbi = isErc20Native ? abi.Erc20ABI : abi.tokenABI;
  const contract = new web3.eth.Contract(tokenAbi, address);

  try {
    const balance = await contract.methods.balanceOf(account).call();

    return Web3.utils.toBN(balance);
  } catch (err) {
    console.info(
      `%c [ get token(${address}) balance error. account: ${account} ]-52`,
      'font-size:13px; background:pink; color:#bf2c9f;',
      (err as Record<string, string>).message
    );
  }

  return Web3.utils.toBN(0);
}

export const getErc20Meta = memoize(erc20Meta);

export const getMappedTokenMeta = memoize(mappedMeta);

/**
 * @description other api can get balances:  api.derive.balances.all, api.query.system.account;
 * @see https://github.com/darwinia-network/wormhole-ui/issues/142
 */
export async function getDarwiniaBalances(api: ApiPromise, account = ''): Promise<[string, string]> {
  await waitUntilConnected(api);

  try {
    // type = 0 query ring balance.  type = 1 query kton balance.
    /* eslint-disable */
    const ringUsableBalance = await (api.rpc as any).balances.usableBalance(0, account);
    const ktonUsableBalance = await (api.rpc as any).balances.usableBalance(1, account);
    /* eslint-enable */

    return [ringUsableBalance.usableBalance.toString(), ktonUsableBalance.usableBalance.toString()];
  } catch (error: unknown) {
    console.warn(
      '%c [ Failed to  querying balance through rpc ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      (error as Record<string, string>).message
    );
  }

  try {
    const { data } = (await api.query.system.account(account)) as AccountInfo;
    const { free, freeKton } = data as unknown as AccountData;

    return [free.toString(), freeKton.toString()];
  } catch (error) {
    console.warn(
      '%c [ Failed to  querying balance through account info ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      (error as Record<string, string>).message
    );

    return ['0', '0'];
  }
}
