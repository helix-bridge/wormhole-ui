import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import Web3 from 'web3';
import { NETWORK_CONFIG } from '../../config';
import { NetworkCategory } from '../../model';
import { canConvertToEth, convertToEth, convertToSS58, dvmAddressToAccountId } from './address';

export const isValidAddress = (address: string, type: NetworkCategory): boolean => {
  if (type === 'ethereum') {
    const isDvm = Web3.utils.isAddress(address);
    const isSS58 = isSS58Address(address);

    return isDvm || (isSS58 && canConvertToEth(address));
  }

  if (type === 'polkadot') {
    return isSS58Address(address);
  }

  return false;
};

export const isSS58Address = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));

    return true;
  } catch (error) {
    return false;
  }
};
// eslint-disable-next-line complexity
export const isSameAddress = (from: string, to: string): boolean => {
  if (from === to) {
    return true;
  }

  let toAddress: string | null = to;
  let fromAddress: string = from;

  if (Web3.utils.isAddress(from)) {
    try {
      toAddress = convertToEth(to);
    } catch (err) {
      console.warn(
        '%c [ file: src/utils/helper/validate.ts  ]- function: isSameAddress',
        'font-size:13px; background:pink; color:#bf2c9f;',
        err.message
      );
    }
  }

  if (isSS58Address(from)) {
    if (Web3.utils.isAddress(to)) {
      toAddress = dvmAddressToAccountId(to).toHuman();
    }

    if (isSS58Address(to)) {
      toAddress = convertToSS58(to, NETWORK_CONFIG.darwinia.ss58Prefix);
      fromAddress = convertToSS58(from, NETWORK_CONFIG.darwinia.ss58Prefix);
    }
  }

  return fromAddress === toAddress;
};
