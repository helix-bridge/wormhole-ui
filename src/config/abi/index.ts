import { AbiItem } from 'web3-utils';
import ktonABI from './ktonABI.json';
import tokenABI from './tokenABI.json';
import registryABI from './registryABI.json';

type keys = 'ktonABI' | 'tokenABI' | 'registryABI';

export const abi = { tokenABI, ktonABI, registryABI } as { [key in keys]: AbiItem[] };
