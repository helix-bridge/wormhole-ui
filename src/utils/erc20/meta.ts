// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import contractMap from '@metamask/contract-metadata';
import { memoize } from 'lodash';
import Web3 from 'web3';
import { abi } from '../../config';

interface TokenCache {
  address: string;
  symbol: string;
  decimals: string;
  name: string;
  logo: string;
  erc20?: boolean;
}

const DEFAULT_SYMBOL = '';
const DEFAULT_DECIMALS = '18';

async function metaInfo(tokenAddress: string): Promise<TokenCache> {
  if (contractMap[tokenAddress]) {
    return contractMap[tokenAddress];
  }

  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(abi.Erc20ABI, tokenAddress);
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

/**
 *
 * @param tokenAddress - token contract address
 * @param account - current active metamask account
 * @returns balance of the account
 */
export async function getTokenBalance(address: string, account: string, isEth = true) {
  const web3 = new Web3(window.ethereum);
  const tokenAbi = isEth ? abi.Erc20ABI : abi.tokenABI;
  const contract = new web3.eth.Contract(tokenAbi, address);

  try {
    const balance = await contract.methods.balanceOf(account).call();

    return Web3.utils.toBN(balance);
  } catch (err) {
    console.info(
      '%c [ get token balance error ]-52',
      'font-size:13px; background:pink; color:#bf2c9f;',
      (err as Record<string, string>).message
    );
  }

  return Web3.utils.toBN(0);
}

export const getTokenMeta = memoize(metaInfo);
