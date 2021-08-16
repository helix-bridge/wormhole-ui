import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import Web3 from 'web3';
import { NETWORK_CONFIG } from '../../config';
import { Network, NetworkCategory, SS58Prefix } from '../../model';
import { isPolkadotNetwork } from '../network';
import { canConvertToEth, convertToEth, convertToSS58, dvmAddressToAccountId } from './address';

// eslint-disable-next-line complexity
export const isValidAddress = (address: string, network: Network | NetworkCategory, strict = false): boolean => {
  if (network === 'ethereum') {
    const isDvm = Web3.utils.isAddress(address);
    const isSS58 = isSS58Address(address);

    return isDvm || (isSS58 && canConvertToEth(address));
  }

  if (network === 'polkadot') {
    return isSS58Address(address);
  }

  if (isPolkadotNetwork(network as Network)) {
    return strict ? isSS58Address(address, NETWORK_CONFIG[network as Network].ss58Prefix) : isSS58Address(address);
  }

  return false;
};

export const isSS58Address = (address: string, ss58Prefix?: SS58Prefix) => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address)
        : ss58Prefix
        ? decodeAddress(address, false, ss58Prefix)
        : decodeAddress(address)
    );

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
