// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import contractMap from '@metamask/contract-metadata';
import { memoize } from 'lodash';
import Web3 from 'web3';
import { abi, NETWORK_CONFIG } from '../../config';
import { NetConfig, Network } from '../../model';
import { getUnit } from '../helper';

interface TokenCache {
  address: string;
  symbol?: string;
  decimals?: string;
  name?: string;
  logo?: string;
  erc20?: boolean;
}

const DEFAULT_SYMBOL = '';
const DEFAULT_DECIMALS = '0';

/**
 * tokenCache: { address: string; symbol?: string; decimals?: string; name?: string; logo?: string;}[];
 */
const tokenCache: TokenCache[] = [];

function updateTokenCache(value: TokenCache) {
  const { address, ...others } = value;
  const index = tokenCache.findIndex((token) => token.address === address);

  if (index > 0) {
    tokenCache[index] = { ...tokenCache[index], ...others };
  } else {
    tokenCache.push(value);
  }

  return tokenCache;
}

const contractList = Object.entries(contractMap as Record<string, TokenCache>)
  .map(([address, tokenData]) => ({ ...tokenData, address }))
  .filter((tokenData) => Boolean(tokenData.erc20));

const getProvider = memoize(
  (config: NetConfig) => new Web3(config.provider.etherscan),
  (config) => config.provider.etherscan
);

const getContractAtAddress = memoize((tokenAddress: string, config: NetConfig) => {
  const web3 = getProvider(config);

  return new web3.eth.Contract(abi.Erc20ABI, tokenAddress);
});

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
    console.info('%c [ get token balance error ]-52', 'font-size:13px; background:pink; color:#bf2c9f;', err.message);
  }

  return Web3.utils.toBN(0);
}

async function getSymbolFromContract(tokenAddress: string, config: NetConfig) {
  const token = getContractAtAddress(tokenAddress, config);

  try {
    const result = await token.methods.symbol().call();
    return result;
  } catch (error) {
    console.warn(`symbol() call for token at address ${tokenAddress} resulted in error:`, error.message);
    return undefined;
  }
}

const casedContractMap: Record<string, TokenCache> = Object.keys(contractMap).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMap[base],
  };
}, {});

function getContractMetadata(tokenAddress: string) {
  return tokenAddress && casedContractMap[tokenAddress.toLowerCase()];
}

async function getSymbol(tokenAddress: string, config: NetConfig) {
  let symbol = await getSymbolFromContract(tokenAddress, config);

  if (!symbol) {
    const contractMetadataInfo = getContractMetadata(tokenAddress);

    if (contractMetadataInfo) {
      symbol = contractMetadataInfo.symbol;
    }
  }

  return symbol;
}

async function getDecimalsFromContract(tokenAddress: string, config: NetConfig) {
  const token = getContractAtAddress(tokenAddress, config);

  try {
    const result = await token.methods.decimals().call();
    const decimalsBN = result;

    return decimalsBN?.toString();
  } catch (error) {
    console.warn(`decimals() call for token at address ${tokenAddress} resulted in error:`, error.message);
    return undefined;
  }
}

async function getDecimals(tokenAddress: string, config: NetConfig) {
  let decimals = await getDecimalsFromContract(tokenAddress, config);

  if (!decimals || decimals === '0') {
    const contractMetadataInfo = getContractMetadata(tokenAddress);

    if (contractMetadataInfo) {
      decimals = contractMetadataInfo.decimals;
    }
  }

  return decimals;
}

// eslint-disable-next-line complexity
export async function getSymbolAndDecimals(tokenAddress: string, config: NetConfig, cacheFirst = true) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTarget = ({ address }: any) => address === tokenAddress;
  const fromCache = tokenCache.find(isTarget);
  const fromContractList = contractList.find(isTarget);

  if ((fromCache || fromContractList) && cacheFirst) {
    return {
      symbol: fromCache?.symbol || fromContractList?.symbol,
      decimals: fromCache?.decimals || fromContractList?.decimals,
    };
  }

  let symbol;
  let decimals;

  try {
    symbol = await getSymbol(tokenAddress, config);
    decimals = await getDecimals(tokenAddress, config);
  } catch (error) {
    console.warn(`symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`, error);
  }

  const result = {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || DEFAULT_DECIMALS,
  };

  updateTokenCache({ address: tokenAddress, ...result });

  return result;
}

export function getNameAndLogo(tokenAddress: string) {
  const { name, logo } = contractList.find((token) => token.address === tokenAddress) || {}; // logo: image name;

  updateTokenCache({ address: tokenAddress, name, logo });

  return { name, logo };
}

export const tokenInfoGetter = ((cacheFirst = true) => {
  const tokens: Record<string, Partial<TokenCache>> = {};

  return async (address: string, config: NetConfig) => {
    if (tokens[address]) {
      return tokens[address];
    }

    tokens[address] = await getSymbolAndDecimals(address, config, cacheFirst);

    return tokens[address];
  };
})();

export function getTokenName(name: string, symbol: string) {
  return !name ? symbol : `${name} (${symbol})`;
}

export async function getUnitFromAddress(address: string, network: Network) {
  const config = NETWORK_CONFIG[network];
  const { decimals } = await getSymbolAndDecimals(address, config);

  return getUnit(+decimals);
}
