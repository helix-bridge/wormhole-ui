import { upperFirst } from 'lodash';
import { combineLatest, EMPTY, forkJoin, from, iif, NEVER, Observable, of, take, timer, zip } from 'rxjs';
import { catchError, delay, map, mergeMap, retry, retryWhen, scan, startWith, switchMap, tap } from 'rxjs/operators';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { abi, DarwiniaApiPath, LONG_DURATION, RegisterStatus } from '../../config';
import { Erc20RegisterProof, Erc20RegisterProofRes, Erc20Token, MappedToken, NetConfig, Tx } from '../../model';
import {
  apiUrl,
  ClaimNetworkPrefix,
  encodeBlockHeader,
  encodeMMRRootMessage,
  getMMRProof,
  getMPTProof,
  isS2S,
  isSubstrateDVM2Substrate,
  MMRProof,
} from '../helper';
import { entrance, getAvailableNetwork, getMetamaskActiveAccount, netConfigToVertices } from '../network';
import { rxGet } from '../records';
import { getContractTxObs, getErc20MappingPrams, getS2SMappingParams } from '../tx';
import { getErc20Meta, getTokenBalance } from './meta';

export type StoredProof = {
  mmrProof: MMRProof;
  registerProof: Erc20RegisterProof;
  eventsProof: string;
};

const proofMemo: StoredProof[] = [];

/* --------------------------------------------Inner Section------------------------------------------------------- */

/**
 * @function getFromDvm - get all tokens at dvm side
 * @params {string} currentAccount
 * @returns tokens that status maybe registered or registering
 */
function getMappedTokensFromDvm(
  currentAccount: string,
  departure: NetConfig,
  arrival: NetConfig,
  mappingAddress: string
) {
  const web3 = entrance.web3.getInstance(departure.provider.rpc);
  const s2s = isS2S(netConfigToVertices(departure), netConfigToVertices(arrival));
  const mappingContract = new web3.eth.Contract(
    s2s ? abi.S2SMappingTokenABI : abi.Erc20MappingTokenABI,
    mappingAddress
  );
  const countObs = from(mappingContract.methods.tokenLength().call() as Promise<number>);
  // FIXME: method predicate logic below should be removed after abi method is unified.
  const getToken = (index: number) =>
    from(mappingContract.methods[s2s ? 'allMappingTokens' : 'allTokens'](index).call() as Promise<string>).pipe(
      switchMap((address) => {
        const tokenObs = from(getErc20Meta(address));
        const infoObs = from(
          mappingContract.methods[s2s ? 'mappingToken2Info' : 'tokenToInfo'](address).call() as Promise<{
            source: string;
            backing: string;
          }>
        );
        const statusObs = s2s
          ? of(1)
          : infoObs.pipe(switchMap(({ source }) => getTokenRegisterStatus(source, departure, false)));
        const balanceObs = currentAccount
          ? from(getTokenBalance(address, currentAccount, false))
          : of(Web3.utils.toBN(0));

        return zip(
          [tokenObs, infoObs, statusObs, balanceObs],
          (token, info, status, balance) =>
            ({
              ...info,
              ...token,
              balance,
              status,
              address,
            } as MappedToken)
        );
      })
    );

  return getMappedTokens(countObs, getToken);
}

/**
 * @description get all tokens at ethereum side
 * @returns tokens that status maybe registered or registering
 */
function getMappedTokensFromEthereum(currentAccount: string, config: NetConfig) {
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const backingContract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);
  const countObs = from(backingContract.methods.assetLength().call() as Promise<number>);
  const getToken = (index: number) =>
    from(backingContract.methods.allAssets(index).call() as Promise<string>).pipe(
      switchMap((address) => {
        const infoObs = from(getErc20Meta(address)).pipe(catchError(() => of({})));
        const statusObs = from(getTokenRegisterStatus(address, config));
        const balanceObs = currentAccount ? from(getTokenBalance(address, currentAccount)) : of(Web3.utils.toBN(0));

        return zip(
          [infoObs, statusObs, balanceObs],
          (info, status, balance) =>
            ({
              ...info,
              balance,
              status,
              address,
              source: address,
              backing: backingContract.options.address,
            } as MappedToken)
        );
      })
    );

  return getMappedTokens(countObs, getToken);
}

function getMappedTokens(countObs: Observable<number>, token: (index: number) => Observable<MappedToken>) {
  const interval = 200;
  const retryCount = 5;
  const tokensObs = countObs.pipe(
    retry(retryCount),
    switchMap((len) => timer(interval, 0).pipe(take(len))),
    mergeMap((index) => token(index)),
    scan((acc: MappedToken[], cur: MappedToken) => [...acc, cur], []),
    startWith([])
  );

  return combineLatest([countObs.pipe(retry(retryCount)), tokensObs], (total, tokens) => ({ total, tokens }));
}

/**
 * @function getSymbolType - Predicate the return type of the symbol method in erc20 token abi;
 */
const getSymbolType: (address: string) => Promise<{ symbol: string; isString: boolean }> = async (address) => {
  try {
    const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
    const stringContract = new web3.eth.Contract(abi.Erc20StringABI, address);
    const symbol = await stringContract.methods.symbol().call();

    return { symbol, isString: true };
  } catch (error) {
    const { symbol } = await getErc20Meta(address);

    return { symbol, isString: false };
  }
};

/* --------------------------------------------Exported Section------------------------------------------------------- */

/**
 *
 * @params {string} currentAccount - metamask active account
 * @params {string} networkType - eth or darwinia
 * for eth: both address and source fields in result are all represent the token's ethereum address, actually equal
 * for dvm: the address field represent the token's dvm address, the source field represent the token's ethereum address.
 */
// eslint-disable-next-line complexity
export const getKnownMappedTokens = (
  currentAccount: string,
  departure: NetConfig,
  arrival: NetConfig
): Observable<{ total: number; tokens: Erc20Token[] }> => {
  if (!currentAccount) {
    return of({ total: 0, tokens: [] });
  }

  const mappingAddressObs = iif(
    () => isSubstrateDVM2Substrate(netConfigToVertices(departure), netConfigToVertices(arrival)),
    from(getS2SMappingParams(departure.provider.rpc)),
    from(getErc20MappingPrams(departure.provider.rpc))
  );

  return departure.type.includes('ethereum')
    ? getMappedTokensFromEthereum(currentAccount, departure)
    : mappingAddressObs.pipe(
        switchMap(({ mappingAddress }) => getMappedTokensFromDvm(currentAccount, departure, arrival, mappingAddress))
      );
};

/**
 * @description test address 0x1F4E71cA23f2390669207a06dDDef70BDE75b679;
 * @params { Address } address - erc20 token address
 */
export function launchRegister(address: string, config: NetConfig): Observable<Tx> {
  const senderObs = from(getMetamaskActiveAccount());
  const symbolObs = from(getSymbolType(address));
  const hasRegisteredObs = from(getTokenRegisterStatus(address, config)).pipe(map((status) => !!status));

  return forkJoin([senderObs, symbolObs, hasRegisteredObs]).pipe(
    switchMap(([sender, { isString }, has]) => {
      return has
        ? EMPTY
        : getContractTxObs(
            config.erc20Token.bankingAddress,
            (contract) => {
              const register = isString ? contract.methods.registerToken : contract.methods.registerTokenBytes32;

              return register(address).send({ from: sender });
            },
            abi.bankErc20ABI
          );
    })
  );
}

/**
 * @description - 1. querying proof of the register token until the get it.
 * 2. calculate mpt proof and mmr proof then combine them together
 * 3. cache the result and emit it to proof subject.
 */
export const getRegisterProof: (address: string, config: NetConfig) => Observable<StoredProof> = (
  address: string,
  config: NetConfig
) => {
  const proofMemoItem = proofMemo.find((item) => item.registerProof.source === address);

  if (proofMemoItem) {
    return of(proofMemoItem);
  }

  const targetConfig = getAvailableNetwork(config.name);
  const apiObs = from(entrance.polkadot.getInstance(targetConfig!.provider.rpc).isReady);

  return rxGet<Erc20RegisterProofRes>({
    url: apiUrl(config.api.dapp, DarwiniaApiPath.issuingRegister),
    params: { source: address },
  }).pipe(
    map((data) => {
      if (!data || !data.mmr_root || !data.signatures) {
        const msg = `The proof of the register token address(${address}) is null, refetch it after ${LONG_DURATION} seconds`;

        throw new Error(msg);
      }

      return data;
    }),
    retryWhen((error) => error.pipe(delay(LONG_DURATION))),
    switchMap((registerProof) => {
      const { block_hash, block_num, mmr_index } = registerProof;
      const mptProof = apiObs.pipe(
        switchMap((api) => getMPTProof(api, block_hash, config.erc20Token.proofAddress)),
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
      const mmr = apiObs.pipe(switchMap((api) => getMMRProof(api, block_num, mmr_index, block_hash))).pipe(
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

      return zip(mptProof, mmr, (eventsProof, mmrProof) => ({
        registerProof,
        mmrProof,
        eventsProof,
      }));
    }),
    tap((proof) => proofMemo.push(proof))
  );
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

    let web3: Web3;
    let contract: Contract;

    if (isEth) {
      web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);

      contract = new web3.eth.Contract(abi.bankErc20ABI, config.erc20Token.bankingAddress);
    } else {
      web3 = entrance.web3.getInstance(config.provider.etherscan);

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

export function confirmRegister(proof: StoredProof, config: NetConfig): Observable<Tx> {
  const { eventsProof, mmrProof, registerProof } = proof;
  const { signatures, mmr_root, mmr_index, block_header } = registerProof;
  const { peaks, siblings } = mmrProof;
  const senderObs = from(getMetamaskActiveAccount());
  const toConfig = getAvailableNetwork(config.name)!;
  const mmrRootMessage = encodeMMRRootMessage({
    root: mmr_root,
    prefix: upperFirst(toConfig.name) as ClaimNetworkPrefix,
    methodID: '0x479fbdf9',
    index: +mmr_index,
  });
  const blockHeader = encodeBlockHeader(block_header);

  return senderObs.pipe(
    switchMap((sender) =>
      getContractTxObs(
        config.erc20Token.bankingAddress,
        (contract) =>
          contract.methods
            .crossChainSync(
              mmrRootMessage.toHex(),
              signatures.split(','),
              mmr_root,
              mmr_index,
              blockHeader.toHex(),
              peaks,
              siblings,
              eventsProof
            )
            .send({ from: sender }),
        abi.bankErc20ABI
      )
    )
  );
}
