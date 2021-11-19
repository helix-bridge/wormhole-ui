import { ApiPromise } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import { hexToU8a } from '@polkadot/util';
import { lastValueFrom, map } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { MMR_QUERY } from '../../config';
import { genProof } from '../mmr';
import { convert } from '../mmrConvert/ckb_merkle_mountain_range_bg';
import { remove0x } from '.';

export type ClaimNetworkPrefix = 'Darwinia' | 'Pangolin';

export interface MMRProof {
  mmrSize: string;
  peaks: string[];
  siblings: string[];
}

interface EncodeMMRoot {
  prefix: ClaimNetworkPrefix;
  methodID: string;
  index: number;
  root: string;
}

export function encodeBlockHeader(blockHeaderStr: string) {
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

export function encodeMMRRootMessage(root: EncodeMMRoot) {
  const registry = new TypeRegistry();

  return registry.createType(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    '{"prefix": "Vec<u8>", "methodID": "[u8; 4; methodID]", "index": "Compact<u32>", "root": "H256"}' as any,
    root
  );
}

export async function getMMRProof(
  api: ApiPromise,
  blockNumber: number,
  mmrBlockNumber: number,
  blockHash: string
): Promise<MMRProof> {
  await api.isReady;

  // !FIXME: hardcoded url
  const fetchProofs = proofsFactory('https://api.subquery.network/sq/darwinia-network/darwinia-mmr');
  const proof = await genProof(blockNumber, mmrBlockNumber, fetchProofs);
  const encodeProof = proof.proof.map((item) => remove0x(item.replace(/(^\s*)|(\s*$)/g, ''))).join('');
  const size = new TypeRegistry().createType('u64', proof.mmrSize.toString());
  const mmrProofConverted: string = convert(
    blockNumber,
    size as unknown as BigInt,
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

export async function getMPTProof(
  api: ApiPromise,
  hash = '',
  proofAddress = '0xf8860dda3d08046cf2706b92bf7202eaae7a79191c90e76297e0895605b8b457'
) {
  await api.isReady;

  const proof = await api.rpc.state.getReadProof([proofAddress], hash);
  const registry = new TypeRegistry();

  return registry.createType('Vec<Bytes>', proof.proof.toJSON());
}

function proofsFactory(url: string) {
  return (ids: number[]): Promise<string[]> => {
    const obs = ajax
      .post<{ data: { nodeEntities: { nodes: { hash: string; id: string }[] } } }>(
        url,
        { query: MMR_QUERY, variables: { ids: ids.map((item) => item.toString()) } },
        { 'Content-Type': 'application/json', accept: 'application/json' }
      )
      .pipe(
        map((res) => {
          const nodes = res.response.data.nodeEntities.nodes;

          return ids.reduce((acc: string[], id: number) => {
            const target = nodes.find((node) => +node.id === id);

            return target ? [...acc, target.hash] : acc;
          }, []);
        })
      );

    return lastValueFrom(obs);
  };
}
