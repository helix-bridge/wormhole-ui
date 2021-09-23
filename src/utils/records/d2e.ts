import { typesBundleForPolkadotApps } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress } from '@polkadot/util-crypto';
import { catchError, EMPTY, filter, from, map, Observable, switchMap, take, zip } from 'rxjs';
import { Contract } from 'web3-eth-contract';
import { abi, DarwiniaApiPath, NETWORK_CONFIG } from '../../config';
import { D2EHistoryRes, D2EMeta, HistoryReq, LockEventsStorage, Network, Tx } from '../../model';
import {
  apiUrl,
  ClaimNetworkPrefix,
  encodeBlockHeader,
  encodeMMRRootMessage,
  getMMRProof,
  getMPTProof,
} from '../helper';
import { getAvailableNetworks, getEthConnection } from '../network';
import { buf2hex, getContractTxObs } from '../tx';
import { getHistoryQueryParams, rxGet } from './api';

export function queryD2ERecords({
  address,
  confirmed,
  network,
  paginator,
}: HistoryReq): Observable<D2EHistoryRes | null> {
  if (network === null || address === null || address === '') {
    return EMPTY;
  }

  const config = NETWORK_CONFIG[network];
  const api = config.api.dapp;

  return rxGet<D2EHistoryRes>({
    url: apiUrl(api, DarwiniaApiPath.locks),
    params: getHistoryQueryParams({ address: buf2hex(decodeAddress(address).buffer), confirmed, paginator }),
  }).pipe(
    catchError((err) => {
      console.error('%c [ d2e records request error: ]', 'font-size:13px; background:pink; color:#bf2c9f;', err);
      return [];
    })
  );
}

export interface ClaimInfo {
  networkPrefix: ClaimNetworkPrefix;
  mmrIndex: number;
  mmrRoot: string;
  mmrSignatures: string;
  blockNumber: number;
  blockHeaderStr: string;
  blockHash: string;
  meta: D2EMeta;
}

export interface Proof {
  root: string;
  MMRIndex: number;
  blockNumber: number;
  blockHeader: string;
  peaks: string[];
  siblings: string[];
  eventsProofStr: string;
}

export interface AppendedProof extends Proof {
  message: string;
  signatures: string[];
}

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
  const provider = new WsProvider(config.provider.rpc);
  const apiObs = from(
    ApiPromise.create({
      provider,
      typesBundle: typesBundleForPolkadotApps,
    })
  );
  const toNetworkConfig = getAvailableNetworks(network)!;
  const header = encodeBlockHeader(blockHeaderStr);
  const storageKey = getD2ELockEventsStorageKey(blockNumber, config.lockEvents);
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
    switchMap((txFn) => getContractTxObs(toNetworkConfig.tokenContract.bankEthereum || '', txFn, abi.tokenIssuingABI))
  );
}

function getD2ELockEventsStorageKey(blockNumber: number, lockEvents: LockEventsStorage[] = []) {
  const matchedStorageKey = lockEvents?.find(
    (item) => item.min <= blockNumber && (item.max === null || item?.max >= blockNumber)
  );

  return matchedStorageKey?.key;
}
