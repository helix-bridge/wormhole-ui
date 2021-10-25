import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import BN from 'bn.js';
import type { ValidatorRule } from 'rc-field-form/lib/interface';
import { TFunction } from 'react-i18next';
import Web3 from 'web3';
import { NETWORK_CONFIG } from '../../config';
import { Network, NetworkCategory, SS58Prefix, TokenChainInfo } from '../../model';
import { isPolkadotNetwork } from '../network';
import { canConvertToEth, convertToEth, convertToSS58, dvmAddressToAccountId } from './address';
import { toWei } from './balance';

// eslint-disable-next-line complexity
export const isValidAddress = (address: string, network: Network | NetworkCategory, strict = false): boolean => {
  if (network === 'ethereum') {
    const isDvm = Web3.utils.isAddress(address);
    const isSS58 = isSS58Address(address);

    return isDvm || (isSS58 && canConvertToEth(address));
  }

  if (network === 'polkadot') {
    return strict ? isSS58Address(address, 0) : isSS58Address(address);
  }

  if (isPolkadotNetwork(network as Network)) {
    return strict ? isSS58Address(address, NETWORK_CONFIG[network as Network].ss58Prefix) : isSS58Address(address);
  }

  if (network === 'tron') {
    return window.tronWeb && window.tronWeb.isAddress(address);
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
        (err as unknown as Record<string, string>).message
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

export const isRing = (name: string | null | undefined) => /ring/i.test(String(name));

export const isKton = (name: string | null | undefined) => /kton/i.test(String(name));

export const isDeposit = (name: string | null | undefined) => /deposit/i.test(String(name));

/* ------------------------------------Form Validators------------------------------------- */

export type Validator = ValidatorRule['validator'];

export interface ValidateOptions {
  t: TFunction;
  compared?: string | BN | number;
  token?: TokenChainInfo;
  asset?: string;
}

export type ValidatorFactory = (options: ValidateOptions) => Validator;

export type ValidatorRuleFactory = (options: ValidateOptions) => ValidatorRule;

const zeroAmountValidator: Validator = (_o, val) => {
  return new BN(val).isZero() ? Promise.reject() : Promise.resolve();
};

export const zeroAmountRule: ValidatorRuleFactory = (options) => {
  const { t } = options;

  return { validator: zeroAmountValidator, message: t('The transfer amount must great than 0') };
};

const amountLessThanFeeValidatorFactory: ValidatorFactory = (options) => (_, val) => {
  const { token, compared: fee, asset } = options;
  const { decimal = 'gwei' } = token || {};

  const cur = new BN(toWei({ value: val, unit: decimal }));
  let pass = true;

  if (isRing(asset)) {
    pass = cur.gte(new BN(fee || 0));
  }

  return pass ? Promise.resolve() : Promise.reject();
};

export const amountLessThanFeeRule: ValidatorRuleFactory = (options) => {
  const { t } = options;
  const validator = amountLessThanFeeValidatorFactory(options);

  return { validator, message: t('The transfer amount is not enough to cover the fee') };
};

const insufficientBalanceValidatorFactory: ValidatorFactory = (options) => (_, val) => {
  const { compared = '0', token } = options;
  const max = new BN(compared);
  const value = new BN(toWei({ value: val, unit: token?.decimal ?? 'gwei' }));

  return value.gt(max) ? Promise.reject() : Promise.resolve();
};

export const insufficientBalanceRule: ValidatorRuleFactory = (options) => {
  const { t } = options;
  const validator = insufficientBalanceValidatorFactory(options);

  return { validator, message: t('Insufficient balance') };
};
