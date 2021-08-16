import { typesBundleForPolkadotApps } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress } from '@polkadot/util-crypto';
import { catchError, EMPTY, filter, from, map, Observable, switchMap, take, zip } from 'rxjs';
import { abi, DarwiniaApiPath, NETWORK_CONFIG } from '../../config';
import { D2EHistoryRes, D2EMeta, LockEventsStorage, Network, Paginator, Tx } from '../../model';
import {
  apiUrl,
  ClaimNetworkPrefix,
  encodeBlockHeader,
  encodeMMRRootMessage,
  getMMRProof,
  getMPTProof,
} from '../helper';
import { getEthConnection } from '../network';
import { buf2hex, getContractTxObs } from '../tx';
import { rxGet } from './api';

export function queryD2ERecords(
  network: Network | null,
  address: string | null,
  paginator?: Paginator
): Observable<D2EHistoryRes | null> {
  if (network === null || address === null || address === '') {
    return EMPTY;
  }

  const config = NETWORK_CONFIG[network];
  const api = config.api.dapp;
  const params = {
    address: buf2hex(decodeAddress(address).buffer),
    ...(paginator ?? { row: 100, page: 0 }),
  };

  return rxGet<D2EHistoryRes>({ url: apiUrl(api, DarwiniaApiPath.locks), params }).pipe(
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
  const provider = new WsProvider(config.rpc);
  const apiObs = from(
    ApiPromise.create({
      provider,
      typesBundle: typesBundleForPolkadotApps,
    })
  );
  const toNetwork: Network = network === 'pangolin' ? 'ropsten' : 'ethereum'; // FIXME: find from by to
  const header = encodeBlockHeader(blockHeaderStr);
  const storageKey = getD2ELockEventsStorageKey(blockNumber, config.lockEvents);
  const accountObs = getEthConnection(toNetwork).pipe(
    filter(({ status }) => status === 'success'),
    map(({ accounts }) => accounts[0].address),
    take(1)
  );

  return apiObs.pipe(
    switchMap((api) => {
      const mmrProofObs = from(getMMRProof(api, blockNumber, mmrIndex, blockHash));
      const eventsProofObs = from(getMPTProof(api, blockHash, storageKey));

      return zip([mmrProofObs, eventsProofObs, accountObs], (mmrProof, eventsProof, account) => ({
        account,
        proof: {
          root: '0x' + MMRRoot,
          MMRIndex: best,
          blockNumber,
          blockHeader: header.toHex(),
          peaks: mmrProof.peaks,
          siblings: mmrProof.siblings,
          eventsProofStr: eventsProof.toHex(),
        },
      })).pipe(
        switchMap(({ account, proof }) => {
          const { root, MMRIndex, blockHeader, peaks, siblings, eventsProofStr } = proof;
          const contractAddress = NETWORK_CONFIG[toNetwork].tokenContract.issuingDarwinia || '';

          if (MMRRoot && best && best > blockNumber) {
            return getContractTxObs(
              contractAddress,
              (contract) => {
                contract.methods
                  .verifyProof(root, MMRIndex, blockHeader, peaks, siblings, eventsProofStr)
                  .send({ from: account });
              },
              abi.tokenIssuingABI
            );
          } else {
            const mmrRootMessage = encodeMMRRootMessage({
              prefix: networkPrefix,
              methodID: '0x479fbdf9',
              index: mmrIndex,
              root: mmrRoot,
            });

            return getContractTxObs(
              contractAddress,
              (contract) =>
                contract.methods
                  .appendRootAndVerifyProof(
                    mmrRootMessage.toHex(),
                    mmrSignatures.split(','),
                    mmrRoot,
                    mmrIndex,
                    blockHeader,
                    peaks,
                    siblings,
                    eventsProofStr
                  )
                  .send({ from: account }),
              abi.tokenIssuingABI
            );
          }
        })
      );
    })
  );
}

function getD2ELockEventsStorageKey(blockNumber: number, lockEvents: LockEventsStorage[] = []) {
  const matchedStorageKey = lockEvents?.find(
    (item) => item.min <= blockNumber && (item.max === null || item?.max >= blockNumber)
  );

  return matchedStorageKey?.key;
}
