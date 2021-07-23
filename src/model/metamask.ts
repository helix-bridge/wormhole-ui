/* eslint-disable no-magic-numbers */
export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name?: string;
    symbol?: string; // 2-6 characters long
    // eslint-disable-next-line no-magic-numbers
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

export enum MetamaskNativeNetworkIds {
  ethereum = 1,
  ropsten = 3,
  rinkeby = 4,
  goerli = 5,
  kovan = 42,
}
