import { memoize, upperFirst } from 'lodash';
import { combineLatest, EMPTY, forkJoin, from, interval, NEVER, Observable, of, take, timer, zip } from 'rxjs';
import {
  catchError,
  delay,
  delayWhen,
  map,
  mergeMap,
  retry,
  retryWhen,
  scan,
  startWith,
  switchMap,
  switchMapTo,
  tap,
} from 'rxjs/operators';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { abi, DarwiniaApiPath, LONG_DURATION, RegisterStatus, SHORT_DURATION } from '../../config';
import {
  ChainConfig,
  CrossChainDirection,
  DVMChainConfig,
  Erc20RegisterProof,
  Erc20RegisterProofRes,
  Erc20Token,
  EthereumChainConfig,
  EthereumDVMBridgeConfig,
  MappedToken,
  Tx,
} from '../../model';
import { getAvailableDVMBridge, getBridge, isS2S, isSubstrateDVM2Substrate } from '../bridge';
import { apiUrl, encodeBlockHeader } from '../helper';
import { ClaimNetworkPrefix, encodeMMRRootMessage, getMMR, MMRProof } from '../mmr';
import { chainConfigToVertices, connect, entrance, getMetamaskActiveAccount } from '../network';
import { getMPTProof, rxGet } from '../record';
import { getContractTxObs, getErc20MappingPrams, getS2SMappingParams } from '../tx';
import { getErc20Meta, getTokenBalance } from './tokenInfo';

export type StoredProof = {
  mmrProof: MMRProof;
  registerProof: Erc20RegisterProof;
  eventsProof: string;
};

const proofMemo: StoredProof[] = [];

/* --------------------------------------------Inner Section------------------------------------------------------- */

function createMappingTokenContract(departure: DVMChainConfig, arrival: ChainConfig, mappingAddress: string): Contract {
  const web3 = entrance.web3.getInstance(departure.provider.rpc);
  const s2s = isS2S(chainConfigToVertices(departure), chainConfigToVertices(arrival));

  return new web3.eth.Contract(s2s ? abi.S2SMappingTokenABI : abi.Erc20MappingTokenABI, mappingAddress);
}

const getMappingTokenLength = memoize(
  async (departure: DVMChainConfig, arrival: ChainConfig, mappingAddress: string) => {
    const mappingContract = createMappingTokenContract(departure, arrival, mappingAddress);
    const len: number = await mappingContract.methods.tokenLength().call();

    return len;
  },
  (departure: DVMChainConfig, arrival: ChainConfig, mappingAddress: string) =>
    departure.name + '-' + arrival.name + '-' + mappingAddress
);

/**
 * @function getFromDvm - get all tokens at dvm side
 * @params {string} currentAccount
 * @returns tokens that status maybe registered or registering
 */
function getMappingTokensFromDvm(
  currentAccount: string,
  departure: DVMChainConfig,
  arrival: EthereumChainConfig,
  mappingAddress: string
) {
  const s2s = isS2S(chainConfigToVertices(departure), chainConfigToVertices(arrival));
  const countObs = from(getMappingTokenLength(departure, arrival, mappingAddress));
  // FIXME: method predicate logic below should be removed after abi method is unified.
  const getToken = (index: number) =>
    of(null).pipe(
      switchMap(() => {
        const mappingContract = createMappingTokenContract(departure, arrival, mappingAddress);

        return from(mappingContract.methods[s2s ? 'allMappingTokens' : 'allTokens'](index).call() as Promise<string>);
      }),
      retryWhen((err) =>
        err.pipe(
          tap((error) => {
            console.warn('WEB3 PROVIDER ERROR:', error.message);
            entrance.web3.removeInstance(departure.provider.rpc);
          }),
          delayWhen(() => interval(SHORT_DURATION))
        )
      ),
      switchMap((address) => {
        const mappingContract = createMappingTokenContract(departure, arrival, mappingAddress);
        const tokenObs = from(getErc20Meta(address));
        const infoObs = from(
          mappingContract.methods[s2s ? 'mappingToken2OriginalInfo' : 'tokenToInfo'](address).call() as Promise<{
            source: string;
            backing: string;
          }>
        );
        const bridge = getBridge<EthereumDVMBridgeConfig>([departure, arrival]);
        const statusObs = s2s
          ? of(1)
          : infoObs.pipe(
              switchMap(({ source }) =>
                getTokenRegisterStatus(source, bridge.config.contracts.redeem, arrival.provider.etherscan)
              )
            );
        const balanceObs =
          currentAccount && Web3.utils.isAddress(currentAccount)
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

  return queryMappingTokens(countObs, getToken);
}

/**
 * @description get all tokens at ethereum side
 * @returns tokens that status maybe registered or registering
 */
function getMappingTokensFromEthereum(currentAccount: string, direction: CrossChainDirection) {
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const web3 = entrance.web3.getInstance(entrance.web3.defaultProvider);
  const backingContract = new web3.eth.Contract(abi.bankErc20ABI, bridge.config.contracts.redeem);
  const countObs = from(backingContract.methods.assetLength().call() as Promise<number>);
  const getToken = (index: number) =>
    from(backingContract.methods.allAssets(index).call() as Promise<string>).pipe(
      switchMap((address) => {
        const infoObs = from(getErc20Meta(address)).pipe(catchError(() => of({})));
        const statusObs = from(getTokenRegisterStatus(address, bridge.config.contracts.redeem));
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

  return queryMappingTokens(countObs, getToken);
}

function queryMappingTokens(countObs: Observable<number>, token: (index: number) => Observable<MappedToken>) {
  const retryCount = 5;
  const tokensObs = countObs.pipe(
    switchMap((len) => timer(SHORT_DURATION / 10, 0).pipe(take(len))),
    mergeMap((index) => token(index)),
    retry(retryCount),
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
export const getKnownMappingTokens = (
  currentAccount: string,
  direction: CrossChainDirection
): Observable<{ total: number; tokens: Erc20Token[] }> => {
  if (!currentAccount) {
    return of({ total: 0, tokens: [] });
  }
  const { from: departure, to: arrival } = direction;

  const mappingAddressObs = isSubstrateDVM2Substrate(chainConfigToVertices(departure), chainConfigToVertices(arrival))
    ? from(getS2SMappingParams(departure.provider.rpc))
    : from(getErc20MappingPrams(departure.provider.rpc));

  const tokens = departure.type.includes('ethereum')
    ? getMappingTokensFromEthereum(currentAccount, direction)
    : mappingAddressObs.pipe(
        switchMap(({ mappingAddress }) =>
          getMappingTokensFromDvm(
            currentAccount,
            departure as DVMChainConfig,
            arrival as EthereumChainConfig,
            mappingAddress
          )
        )
      );

  return connect(departure).pipe(switchMapTo(tokens));
};

/**
 * @description test address 0x1F4E71cA23f2390669207a06dDDef70BDE75b679;
 * @params { Address } address - erc20 token address
 */
export function launchRegister(address: string, departure: EthereumChainConfig): Observable<Tx> {
  const senderObs = from(getMetamaskActiveAccount());
  const symbolObs = from(getSymbolType(address));
  const bridge = getAvailableDVMBridge(departure);
  const hasRegisteredObs = from(getTokenRegisterStatus(address, bridge.config.contracts.redeem)).pipe(
    map((status) => !!status)
  );

  return forkJoin([senderObs, symbolObs, hasRegisteredObs]).pipe(
    switchMap(([sender, { isString }, has]) => {
      return has
        ? EMPTY
        : getContractTxObs(
            bridge.config.contracts.redeem,
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
export const getRegisterProof: (address: string, config: EthereumChainConfig) => Observable<StoredProof> = (
  address,
  config
) => {
  const proofMemoItem = proofMemo.find((item) => item.registerProof.source === address);

  if (proofMemoItem) {
    return of(proofMemoItem);
  }

  const bridge = getAvailableDVMBridge(config);
  const apiObs = from(entrance.polkadot.getInstance(bridge.arrival.provider.rpc).isReady);

  return rxGet<Erc20RegisterProofRes>({
    url: apiUrl(bridge.config.api.dapp, DarwiniaApiPath.issuingRegister),
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
        switchMap((api) => getMPTProof(api, block_hash, bridge.config.contracts.proof)),
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
      const mmr = apiObs.pipe(switchMap((api) => getMMR(api, block_num, mmr_index, block_hash))).pipe(
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
  departure: EthereumChainConfig | string,
  provider?: string
) => Promise<RegisterStatus | null> =
  // eslint-disable-next-line complexity
  async (address, departure, provider) => {
    if (!address || !Web3.utils.isAddress(address)) {
      console.warn(`Token address is invalid, except an ERC20 token address. Received value: ${address}`);
      return null;
    }

    const contractAddress =
      typeof departure === 'string' ? departure : getAvailableDVMBridge(departure).config.contracts.redeem;
    const web3 = entrance.web3.getInstance(provider || entrance.web3.defaultProvider);
    const contract = new web3.eth.Contract(abi.bankErc20ABI, contractAddress);
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

export function confirmRegister(proof: StoredProof, departure: EthereumChainConfig): Observable<Tx> {
  const { eventsProof, mmrProof, registerProof } = proof;
  const { signatures, mmr_root, mmr_index, block_header } = registerProof;
  const { peaks, siblings } = mmrProof;
  const senderObs = from(getMetamaskActiveAccount());
  const bridge = getAvailableDVMBridge(departure);
  const mmrRootMessage = encodeMMRRootMessage({
    root: mmr_root,
    prefix: upperFirst(bridge.arrival.name) as ClaimNetworkPrefix,
    methodID: '0x479fbdf9',
    index: +mmr_index,
  });
  const blockHeader = encodeBlockHeader(block_header);

  return senderObs.pipe(
    switchMap((sender) =>
      getContractTxObs(
        bridge.config.contracts.redeem,
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
