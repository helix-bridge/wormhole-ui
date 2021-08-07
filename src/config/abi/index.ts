import { AbiItem } from 'web3-utils';
import bankABI from './bankABI.json';
import ktonABI from './ktonABI.json';
import tokenABI from './tokenABI.json';
import registryABI from './registryABI.json';
import tokenIssuingABI from './tokenIssuingABI.json';

type keys = 'ktonABI' | 'tokenABI' | 'registryABI' | 'bankABI' | 'tokenIssuingABI';

export const abi = { tokenABI, ktonABI, registryABI, bankABI, tokenIssuingABI } as { [key in keys]: AbiItem[] };
