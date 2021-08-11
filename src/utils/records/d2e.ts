import { typesBundleForPolkadotApps } from '@darwinia/types/mix';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { hexToU8a } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { catchError, EMPTY, filter, from, map, Observable, switchMap, take, zip } from 'rxjs';
import { abi, DarwiniaApiPath, NETWORK_CONFIG } from '../../config';
import { D2EHistoryRes, D2EMeta, LockEventsStorage, Network, Paginator, Tx } from '../../model';
import { apiUrl, remove0x } from '../helper';
import { convert } from '../mmrConvert/ckb_merkle_mountain_range_bg';
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

export type ClaimNetworkPrefix = 'Darwinia' | 'Pangolin';

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

interface EncodeMMRoot {
  prefix: ClaimNetworkPrefix;
  methodID: string;
  index: number;
  root: string;
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

function encodeBlockHeader(blockHeaderStr: string) {
  const blockHeaderObj = JSON.parse(blockHeaderStr);
  const registry = new TypeRegistry();

  return registry.createType('Header', {
    parentHash: blockHeaderObj.parent_hash,
    // eslint-disable-next-line id-denylist
    number: blockHeaderObj.block_number,
    stateRoot: blockHeaderObj.state_root,
    extrinsicsRoot: blockHeaderObj.extrinsics_root,
    digest: {
      logs: blockHeaderObj.digest,
    },
  });
}

async function getMMRProof(api: ApiPromise, blockNumber: number, mmrBlockNumber: number, blockHash: string) {
  await api.isReady;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const proof = await api.rpc.headerMMR.genProof(blockNumber, mmrBlockNumber);
  const proofStr = proof.proof.substring(1, proof.proof.length - 1);
  const proofHexStr = proofStr.split(',').map((item: string) => {
    return remove0x(item.replace(/(^\s*)|(\s*$)/g, ''));
  });
  const encodeProof = proofHexStr.join('');
  const mmrProofConverted: string = convert(
    blockNumber,
    proof.mmrSize,
    hexToU8a('0x' + encodeProof),
    hexToU8a(blockHash)
  );

  const [mmrSize, peaksStr, siblingsStr] = mmrProofConverted.split('|');
  const peaks = peaksStr.split(',');
  const siblings = siblingsStr.split(',');

  return {
    mmrSize,
    peaks,
    siblings,
  };
}

async function getMPTProof(
  api: ApiPromise,
  hash = '',
  proofAddress = '0xf8860dda3d08046cf2706b92bf7202eaae7a79191c90e76297e0895605b8b457'
) {
  await api.isReady;

  const proof = await api.rpc.state.getReadProof([proofAddress], hash);
  const registry = new TypeRegistry();

  return registry.createType('Vec<Bytes>', proof.proof.toJSON());
}

function getD2ELockEventsStorageKey(blockNumber: number, lockEvents: LockEventsStorage[] = []) {
  const matchedStorageKey = lockEvents?.find(
    (item) => item.min <= blockNumber && (item.max === null || item?.max >= blockNumber)
  );

  return matchedStorageKey?.key;
}

function encodeMMRRootMessage(root: EncodeMMRoot) {
  const registry = new TypeRegistry();

  return registry.createType(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    '{"prefix": "Vec<u8>", "methodID": "[u8; 4; methodID]", "index": "Compact<u32>", "root": "H256"}' as any,
    root
  );
}
