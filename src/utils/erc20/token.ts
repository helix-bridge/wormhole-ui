import { typesBundleForPolkadotApps } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import BN from 'bn.js';
import { from, iif, NEVER, Observable, of, Subject, zip } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, delay, distinctUntilKeyChanged, map, retryWhen, switchMap, tap } from 'rxjs/operators';
import Web3 from 'web3';
import { abi, NETWORK_CONFIG, RegisterStatus } from '../../config';
import { Erc20Token, NetConfig, Network } from '../../model';
import {
  ClaimNetworkPrefix,
  encodeBlockHeader,
  encodeMMRRootMessage,
  getMMRProof,
  getMPTProof,
  MMRProof,
  toUpperCaseFirst,
} from '../helper';
import { getMetamaskActiveAccount, isNetworkMatch } from '../network';
import { getNameAndLogo, getSymbolAndDecimals, getTokenBalance, getUnitFromAddress, tokenInfoGetter } from './meta';

export type StoredProof = MMRProof & Erc20Token & { eventsProofStr: string };

const proofSubject = new Subject<StoredProof>();
const proofMemo: StoredProof[] = [];

/**
 * proof events stream
 */
export const proofObservable = proofSubject.asObservable().pipe(distinctUntilKeyChanged('source'));

const getTokenInfo = async (tokenAddress: string, config: NetConfig) => {
  const { symbol = '', decimals = 0 } = await tokenInfoGetter(tokenAddress, config);
  const { name, logo } = getNameAndLogo(tokenAddress);

  return {
    symbol,
    decimals,
    name: name ?? '',
    logo: logo ?? '',
  };
};

/**
 *
 * @params {string} currentAccount - metamask active account
 * @params {string} networkType - eth or darwinia
 * for eth: both address and source fields in result are all represent the token's ethereum address, actually equal
 * for dvm: the address field represent the token's dvm address, the source field represent the token's ethereum address.
 */
export const getKnownErc20Tokens = async (currentAccount: string, network: Network): Promise<Erc20Token[]> => {
  if (!currentAccount) {
    return [];
  }
  const config = NETWORK_CONFIG[network];

  return config.type.includes('ethereum')
    ? await getFromEthereum(currentAccount, config)
    : await getFromDvm(currentAccount, config);
};

/**
 * @function getFromDvm - get all tokens at dvm side
 * @params {string} currentAccount
 * @returns tokens that status maybe registered or registering
 */
const getFromDvm = async (currentAccount: string, config: NetConfig) => {
  const web3Darwinia = new Web3(config.rpc);
  const mappingContract = new web3Darwinia.eth.Contract(abi.mappingTokenABI, config.erc20Token.mappingAddress);
  const length = await mappingContract.methods.tokenLength().call(); // length: string
  const tokens = await Promise.all(
    new Array(+length).fill(0).map(async (_, index) => {
      const address = await mappingContract.methods.allTokens(index).call(); // dvm address
      const info = await mappingContract.methods.tokenToInfo(address).call(); // { source, backing }
      const token = await getTokenInfo(info.source, config);
      const status = await getTokenRegisterStatus(info.source, config, false);
      let balance = Web3.utils.toBN(0);

      if (currentAccount) {
        balance = await getTokenBalance(address, currentAccount, false);
      }

      return { ...info, ...token, balance, status, address };
    })
  );

  return tokens;
};

/**
 * @description get all tokens at ethereum side
 * @returns tokens that status maybe registered or registering
 */
const getFromEthereum: (cur: string, con: NetConfig) => Promise<Erc20Token[]> = async (
  currentAccount: string,
  config: NetConfig
) => {
  const web3 = new Web3(window.ethereum);
  const backingContract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);
  const length = await backingContract.methods.assetLength().call();
  const tokens = await Promise.all(
    new Array(+length).fill(0).map(async (_, index) => {
      const address = await backingContract.methods.allAssets(index).call();
      const info = await getTokenInfo(address, config);
      const status = await getTokenRegisterStatus(address, config);
      let balance = Web3.utils.toBN(0);

      if (currentAccount) {
        balance = await getTokenBalance(address, currentAccount);
      }

      return {
        ...info,
        balance,
        status,
        address,
        source: address,
        backing: backingContract.options.address,
      };
    })
  );

  return tokens;
};

/**
 * @description test address 0x1F4E71cA23f2390669207a06dDDef70BDE75b679;
 * @params { Address } address - erc20 token address
 */
export const registerToken = async (address: string, config: NetConfig) => {
  const isRegistered = await hasRegistered(address, config);
  const web3 = new Web3(window.ethereum);
  const backingContract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);

  if (!isRegistered) {
    const sender = await getMetamaskActiveAccount();
    const { isString } = await getSymbolType(address, config);
    const register = isString ? backingContract.methods.registerToken : backingContract.methods.registerTokenBytes32;
    const txHash = await register(address).send({ from: sender });

    console.info(
      '%c [ register token transaction hash ]-118',
      'font-size:13px; background:pink; color:#bf2c9f;',
      txHash
    );

    return generateRegisterProof(address, config).subscribe((proof) => proofSubject.next(proof));
  }
};

/**
 * @function getSymbolType - Predicate the return type of the symbol method in erc20 token abi;
 */
export const getSymbolType: (address: string, config: NetConfig) => Promise<{ symbol: string; isString: boolean }> =
  async (address, config) => {
    try {
      const web3 = new Web3(window.ethereum);
      const stringContract = new web3.eth.Contract(abi.Erc20StringABI, address);
      const symbol = await stringContract.methods.symbol().call();

      return { symbol, isString: true };
    } catch (error) {
      const { symbol } = await getSymbolAndDecimals(address, config);

      return { symbol, isString: false };
    }
  };

const loopQuery = (url: string) => {
  return fromFetch(url, { selector: (response) => response.json() }).pipe(
    map(({ data }) => {
      if (!data || !data.mmr_root || !data.signatures) {
        const msg = `The ${url} api has no result, refetch it after 5 seconds`;

        // console.info(msg);
        throw new Error(msg);
      }

      return data;
    }),
    // eslint-disable-next-line no-magic-numbers
    retryWhen((error) => error.pipe(delay(5000)))
  );
};

/**
 * @description - 1. fetch block hash from server, if block hash has not generated yet, send request every five seconds.
 * 2. calculate mpt proof and mmr proof then combine them together
 * 3. cache the result and emit it to proof subject.
 */
const generateRegisterProof: (address: string, config: NetConfig) => Observable<StoredProof> = (
  address: string,
  config: NetConfig
) => {
  return loopQuery(`${config.api.dapp}/api/ethereumIssuing/register?source=${address}`).pipe(
    switchMap((data) => {
      const { block_hash, block_num, mmr_index } = data;
      const mptProof = from(getMPTProof(block_hash, config.erc20Token.proofAddress)).pipe(
        map((proof) => proof.toHex()),
        catchError((err) => {
          console.warn(
            '%c [ get MPT proof error ]-216',
            'font-size:13px; background:pink; color:#bf2c9f;',
            err.message,
            block_hash
          );

          return NEVER;
        })
      );
      const provider = new WsProvider(config.rpc);
      const apiObs = from(
        ApiPromise.create({
          provider,
          typesBundle: typesBundleForPolkadotApps,
        })
      );
      const mmrProof = apiObs.pipe(switchMap((api) => getMMRProof(api, block_num, mmr_index, block_hash))).pipe(
        catchError((err) => {
          console.warn(
            '%c [ get MMR proof error ]-228',
            'font-size:13px; background:pink; color:#bf2c9f;',
            err.message,
            block_hash,
            block_num,
            mmr_index
          );

          return NEVER;
        })
      );

      return zip(mptProof, mmrProof, (eventsProofStr, proof) => ({
        ...data,
        ...proof,
        eventsProofStr,
      }));
    }),
    tap((proof) => proofMemo.push(proof))
  );
};

/**
 * @description - Check register proof in cache, if exists emit it directly, otherwise get it through api request.
 * @params {Address} address - token address
 */
export const popupRegisterProof = (address: string, config: NetConfig) => {
  const DELAY = 2000;
  const proof = proofMemo.find((item) => item.source === address);
  const fromQuery = generateRegisterProof(address, config);
  const fromMemo = of(proof).pipe(delay(DELAY));

  return iif(() => !!proof, fromMemo, fromQuery).subscribe((pro) => {
    if (pro) {
      proofSubject.next(pro);
    }
  });
};

/**
 *
 * @params {Address} address - erc20 token address
 * @description status - 0: unregister 1: registered 2: registering
 */
export const getTokenRegisterStatus: (
  address: string,
  config: NetConfig,
  isEth?: boolean
) => Promise<RegisterStatus | null> =
  // eslint-disable-next-line complexity
  async (address, config, isEth = true) => {
    if (!address || !Web3.utils.isAddress(address)) {
      console.warn(`Token address is invalid, except an ERC20 token address. Received value: ${address}`);
      return null;
    }
    let web3 = new Web3(window.ethereum);

    let contract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);

    if (!isEth) {
      web3 = new Web3(config.provider.etherscan);

      contract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);
    }

    const { target, timestamp } = await contract.methods.assets(address).call();
    let isTargetTruthy = false;
    const isTimestampExist = +timestamp > 0;

    try {
      // if target exists, the number should be overflow.
      isTargetTruthy = !!Web3.utils.hexToNumber(target);
    } catch (_) {
      isTargetTruthy = true;
    }

    if (isTimestampExist && !isTargetTruthy) {
      return RegisterStatus.registering;
    }

    if (isTimestampExist && isTargetTruthy) {
      return RegisterStatus.registered;
    }

    return RegisterStatus.unregister;
  };

export const hasRegistered: (address: string, config: NetConfig) => Promise<boolean> = async (address, config) => {
  const status = await getTokenRegisterStatus(address, config);

  return !!status;
};

export const confirmRegister = async (proof: StoredProof & Record<string, string>, config: NetConfig) => {
  const { signatures, mmr_root, mmr_index, block_header, peaks, siblings, eventsProofStr } = proof;
  const sender = await getMetamaskActiveAccount();
  const mmrRootMessage = encodeMMRRootMessage({
    root: mmr_root,
    prefix: toUpperCaseFirst(config.name) as ClaimNetworkPrefix,
    methodID: '0x479fbdf9',
    index: +mmr_index,
  });
  const blockHeader = encodeBlockHeader(block_header);
  const web3 = new Web3(window.ethereum);
  const backingContract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);
  // !FIXME: unhandled reject error [object object] on Firefox;
  const tx = await backingContract.methods
    .crossChainSync(
      mmrRootMessage.toHex(),
      signatures.split(','),
      mmr_root,
      mmr_index,
      blockHeader.toHex(),
      peaks,
      siblings,
      eventsProofStr
    )
    .send({ from: sender })
    .on('transactionHash', (hash: string) => {
      console.info('%c [ hash ]-331', 'font-size:13px; background:pink; color:#bf2c9f;', hash);
    })
    .on('error', (error: Record<string, unknown>) => {
      console.info('%c [ error ]-334', 'font-size:13px; background:pink; color:#bf2c9f;', error);
    });

  return tx;
};

export const claimErc20Token = confirmRegister;

export async function canCrossSendToDvm(token: Erc20Token, currentAccount: string) {
  return canCrossSend(token, currentAccount, 'ethereum');
}

export async function canCrossSendToEth(token: Erc20Token, currentAccount: string) {
  return canCrossSend(token, currentAccount, 'darwinia');
}

async function canCrossSend(token: Erc20Token, currentAccount: string, network: Network) {
  const isAllowanceEnough = await hasApproved(token, currentAccount, network);

  if (isAllowanceEnough) {
    return true;
  } else {
    const { contract, contractAddress } = getContractWithAddressByNetwork(token, network);
    const tx = await contract.methods
      .approve(contractAddress, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      .send({ from: currentAccount });

    return tx.transactionHash;
  }
}

function getContractWithAddressByNetwork(token: Erc20Token, network: Network) {
  const { address, source } = token;
  const config = NETWORK_CONFIG[network];
  const tokenABI = network === 'ethereum' ? abi.Erc20ABI : abi.tokenABI;
  const contractAddress = network === 'ethereum' ? config.erc20Token.bankingAddress : config.erc20Token.mappingAddress;
  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(tokenABI, network === 'ethereum' ? source : address);

  return { contract, contractAddress };
}

export async function hasApproved(token: Erc20Token, currentAccount: string, network: Network) {
  const { source, balance: amount } = token;
  const { contract, contractAddress } = getContractWithAddressByNetwork(token, network);
  const unit = await getUnitFromAddress(source, network);
  const allowance = await contract.methods.allowance(currentAccount, contractAddress).call();

  return Web3.utils.toBN(allowance).gte(Web3.utils.toBN(Web3.utils.fromWei(amount.toString(), unit)));
}

/**
 *
 * @params {string} tokenAddress - erc20 token address
 * @params {string} recipientAddress - recipient address, ss58 format
 * @params {BN} amount - transfer token amount
 * @params {string} currentAccount - metamask current active account
 */
export async function crossSendErc20FromEthToDvm(
  tokenAddress: string,
  recipientAddress: string,
  amount: BN,
  currentAccount: string,
  config: NetConfig
) {
  const web3 = new Web3(window.ethereum);
  const backingContract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);
  const tx = await backingContract.methods
    .crossSendToken(tokenAddress, recipientAddress, amount.toString())
    .send({ from: currentAccount });

  return tx.transactionHash;
}

export async function crossSendErc20FromDvmToEth(
  tokenAddress: string,
  recipientAddress: string,
  amount: BN,
  currentAccount: string,
  config: NetConfig
) {
  // dev env pangolin(id: 43) product env darwinia(id: ?);
  const isMatch = await isNetworkMatch(+config.ethereumChain.chainId);

  if (isMatch) {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(abi.mappingTokenABI, config.erc20Token.mappingAddress);
    const tx = await contract.methods
      .crossTransfer(tokenAddress, recipientAddress, amount.toString())
      .send({ from: currentAccount });

    return tx.transactionHash;
  } else {
    throw new Error('Ethereum network type does not match, please switch to {{network}} network in metamask.');
  }
}

/**
 *
 * source - uin256 string
 */
export function decodeUint256(source: string, config: NetConfig): BN {
  const bytes = Web3.utils.hexToBytes(source);
  const hex = Web3.utils.bytesToHex(bytes.reverse());
  const web3 = new Web3(config.provider.etherscan);
  const result = web3.eth.abi.decodeParameter('uint256', hex);

  return Web3.utils.toBN(result.toString());
}

export function tokenSearchFactory<T extends Pick<Erc20Token, 'address' | 'symbol'>>(tokens: T[]) {
  return (value: string) => {
    if (!value) {
      return tokens;
    }

    const isAddress = Web3.utils.isAddress(value);

    return isAddress
      ? tokens.filter((token) => token.address === value)
      : tokens.filter((token) => token.symbol.toLowerCase().includes(value.toLowerCase()));
  };
}
