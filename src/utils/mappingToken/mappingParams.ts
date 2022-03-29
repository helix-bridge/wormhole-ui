import { memoize } from 'lodash';
import { entrance, waitUntilConnected } from '../network';

interface MappingInfo {
  specVersion?: string;
  mappingAddress: string;
}

type S2SInfo = Required<MappingInfo>;

const s2sMappingParams: (rpc: string) => Promise<S2SInfo> = async (rpc: string) => {
  const api = entrance.polkadot.getInstance(rpc);

  await waitUntilConnected(api);

  const module = rpc.includes('pangolin') ? api.query.substrate2SubstrateIssuing : api.query.fromDarwiniaIssuing;
  let mappingAddress = '';

  try {
    mappingAddress = (await module.mappingFactoryAddress()).toString();
  } catch {
    // FIXME: add backing address
  }

  const specVersion = api.runtimeVersion.specVersion.toString();

  return { specVersion, mappingAddress };
};

export const getS2SMappingParams = memoize(s2sMappingParams);

export const getErc20MappingPrams: (rpc: string) => Promise<MappingInfo> = (_: string) => {
  return Promise.resolve({ mappingAddress: '0xcB8531Bc0B7C8F41B55CF4E94698C37b130597B9' });
};
