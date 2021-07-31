import { AbiItem } from 'web3-utils';
import bankABI from './bankABI.json';
import ktonABI from './ktonABI.json';
import tokenABI from './tokenABI.json';
import registryABI from './registryABI.json';

type keys = 'ktonABI' | 'tokenABI' | 'registryABI' | 'bankABI';

export const abi = { tokenABI, ktonABI, registryABI, bankABI } as { [key in keys]: AbiItem[] };
