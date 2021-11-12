import { decodeAddress } from '@polkadot/util-crypto';
import { catchError, filter, from, map, Observable, of, switchMap, take, zip } from 'rxjs';
import { Contract } from 'web3-eth-contract';
import { abi, DarwiniaApiPath, NETWORK_CONFIG } from '../../config';
import {
  D2EHistoryRes,
  D2EMeta,
  DarwiniaConfig,
  EthereumConfig,
  HistoryReq,
  LockEventsStorage,
  Network,
  PangolinConfig,
  Tx,
} from '../../model';
import {
  apiUrl,
  ClaimNetworkPrefix,
  encodeBlockHeader,
  encodeMMRRootMessage,
  getMMRProof,
  getMPTProof,
} from '../helper';
import { entrance, getAvailableNetwork, getEthConnection } from '../network';
import { buf2hex, getContractTxObs } from '../tx';
import { rxGet } from './api';

/* -------------------------------------------Inner Helper Fn---------------------------------------------- */

function getD2ELockEventsStorageKey(blockNumber: number, lockEvents: LockEventsStorage[] = []) {
  const matchedStorageKey = lockEvents?.find(
    (item) => item.min <= blockNumber && (item.max === null || item?.max >= blockNumber)
  );

  return matchedStorageKey?.key;
}

/* -------------------------------------------D2E---------------------------------------------- */

/**
 * @description darwinia -> ethereum
 */
export function queryDarwinia2EthereumIssuingRecords({
  address,
  confirmed,
  network,
  paginator,
}: HistoryReq): Observable<D2EHistoryRes | null> {
  const api = NETWORK_CONFIG[network].api.dapp;

  return rxGet<D2EHistoryRes>({
    url: apiUrl(api, DarwiniaApiPath.locks),
    params: { address: buf2hex(decodeAddress(address).buffer), confirmed, ...paginator },
  }).pipe(
    catchError((err) => {
      console.error('%c [ d2e records request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      return of(null);
    })
  );
}

/* -------------------------------------------DVM2E---------------------------------------------- */

/**
 * @description darwinia DVM -> ethereum
 */
export function queryDarwiniaDVM2EthereumIssuingRecords({
  address,
  confirmed,
  network,
  paginator,
}: HistoryReq): Observable<D2EHistoryRes | null> {
  const api = NETWORK_CONFIG[network].api.dapp;

  return rxGet<D2EHistoryRes>({
    url: apiUrl(api, DarwiniaApiPath.issuingBurns),
    params: { sender: address, confirmed, ...paginator },
  }).pipe(
    catchError((err) => {
      console.error('%c [ dvm2e records request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      return of(null);
    })
  );
}

/* -------------------------------------------Claim Token---------------------------------------------- */

interface ClaimInfo {
  networkPrefix: ClaimNetworkPrefix;
  mmrIndex: number;
  mmrRoot: string;
  mmrSignatures: string;
  blockNumber: number;
  blockHeaderStr: string;
  blockHash: string;
  meta: D2EMeta;
}

/**
 * @description darwinia -> ethereum & darwinia DVM -> ethereum  needs claim action
 */
export function claimToken({
  networkPrefix,
  mmrIndex,
  mmrRoot,
  mmrSignatures,
  blockNumber,
  blockHeaderStr,
  blockHash,
  meta: { MMRRoot, best },
}: ClaimInfo): Observable<Tx> {
  const network = networkPrefix.toLowerCase() as Network;
  const config = NETWORK_CONFIG[network];
  const apiObs = from(entrance.polkadot.getInstance(config.provider.rpc).isReady);
  const toNetworkConfig = getAvailableNetwork(network)! as EthereumConfig;
  const header = encodeBlockHeader(blockHeaderStr);
  const storageKey = getD2ELockEventsStorageKey(blockNumber, (config as PangolinConfig | DarwiniaConfig).lockEvents);
  // TODO: check connection
  const accountObs = getEthConnection().pipe(
    filter(({ status }) => status === 'success'),
    map(({ accounts }) => accounts[0].address),
    take(1)
  );

  return apiObs.pipe(
    switchMap((api) => {
      const eventsProofObs = from(getMPTProof(api, blockHash, storageKey)).pipe(map((str) => str.toHex()));

      return MMRRoot && best && best > blockNumber
        ? zip([from(getMMRProof(api, blockNumber, best, blockHash)), eventsProofObs, accountObs]).pipe(
            map(
              ([mmrProof, eventsProofStr, account]) =>
                (contract: Contract) =>
                  contract.methods
                    .verifyProof(
                      '0x' + MMRRoot,
                      best,
                      header.toHex(),
                      mmrProof.peaks,
                      mmrProof.siblings,
                      eventsProofStr
                    )
                    .send({ from: account })
            )
          )
        : zip([from(getMMRProof(api, blockNumber, mmrIndex, blockHash)), eventsProofObs, accountObs]).pipe(
            map(([mmrProof, eventsProofStr, account]) => {
              const mmrRootMessage = encodeMMRRootMessage({
                prefix: networkPrefix,
                methodID: '0x479fbdf9',
                index: mmrIndex,
                root: mmrRoot,
              });

              return (contract: Contract) =>
                contract.methods
                  .appendRootAndVerifyProof(
                    mmrRootMessage.toHex(),
                    mmrSignatures.split(','),
                    mmrRoot,
                    mmrIndex,
                    header.toHex(),
                    mmrProof.peaks,
                    mmrProof.siblings,
                    eventsProofStr
                  )
                  .send({ from: account });
            })
          );
    }),
    switchMap((txFn) => getContractTxObs(toNetworkConfig.contracts.e2d.redeem || '', txFn, abi.tokenIssuingABI))
  );
}
