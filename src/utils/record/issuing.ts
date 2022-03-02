import { ApiPromise } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { decodeAddress } from '@polkadot/util-crypto';
import { upperFirst } from 'lodash';
import { catchError, filter, from, map, Observable, of, switchMap, take, zip } from 'rxjs';
import { Contract } from 'web3-eth-contract';
import { abi, DarwiniaApiPath } from '../../config';
import {
  CrossChainDirection,
  D2EHistoryRes,
  D2EMeta,
  EthereumDarwiniaBridgeConfig,
  EthereumDVMBridgeConfig,
  HistoryReq,
  LockEventsStorage,
  Tx,
} from '../../model';
import { getBridge } from '../bridge';
import { apiUrl, encodeBlockHeader, rxGet } from '../helper';
import { ClaimNetworkPrefix, encodeMMRRootMessage, getMMR } from '../mmr';
import { connect, entrance, waitUntilConnected } from '../network';
import { buf2hex, genEthereumContractTxObs } from '../tx';

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
  direction,
  paginator,
}: HistoryReq): Observable<D2EHistoryRes | null> {
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

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
  direction,
  paginator,
}: HistoryReq): Observable<D2EHistoryRes | null> {
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const api = bridge.config.api.dapp;

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
  direction: CrossChainDirection;
  mmrIndex: number;
  mmrRoot: string;
  mmrSignatures: string;
  blockNumber: number;
  blockHeaderStr: string;
  blockHash: string;
  meta: D2EMeta;
}

export async function getMPTProof(
  api: ApiPromise,
  hash = '',
  proofAddress = '0xf8860dda3d08046cf2706b92bf7202eaae7a79191c90e76297e0895605b8b457'
) {
  await waitUntilConnected(api);

  const proof = await api.rpc.state.getReadProof([proofAddress], hash);
  const registry = new TypeRegistry();

  return registry.createType('Vec<Bytes>', proof.proof.toJSON());
}

/**
 * @description darwinia -> ethereum & darwinia DVM -> ethereum  needs claim action
 */
export function claimToken({
  direction,
  mmrIndex,
  mmrRoot,
  mmrSignatures,
  blockNumber,
  blockHeaderStr,
  blockHash,
  meta: { MMRRoot, best },
}: ClaimInfo): Observable<Tx> {
  const { from: departure, to: arrival } = direction;
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const networkPrefix = upperFirst(departure.name) as ClaimNetworkPrefix;
  const apiObs = from(entrance.polkadot.getInstance(departure.provider.rpc).isReady);
  const header = encodeBlockHeader(blockHeaderStr);
  const storageKey = getD2ELockEventsStorageKey(blockNumber, bridge.config.lockEvents);
  const accountObs = connect(arrival).pipe(
    filter(({ status }) => status === 'success'),
    map(({ accounts }) => accounts[0].address),
    take(1)
  );

  return apiObs.pipe(
    switchMap((api) => {
      const eventsProofObs = from(getMPTProof(api, blockHash, storageKey)).pipe(map((str) => str.toHex()));

      return MMRRoot && best && best > blockNumber
        ? zip([from(getMMR(api, blockNumber, best, blockHash)), eventsProofObs, accountObs]).pipe(
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
        : zip([from(getMMR(api, blockNumber, mmrIndex, blockHash)), eventsProofObs, accountObs]).pipe(
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
    switchMap((txFn) => genEthereumContractTxObs(bridge.config.contracts.redeem || '', txFn, abi.tokenIssuingABI))
  );
}
