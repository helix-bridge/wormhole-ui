import BigNumber from 'bignumber.js';
import { Unit, unitMap, Units } from 'web3-utils';
import BN from 'bn.js';
import { isNull, isNumber, isString, isUndefined } from 'lodash';
import Web3 from 'web3';

export type WeiValue = string | BN | number | null | undefined;
export interface PrettyNumberOptions {
  withThousandSplit?: boolean;
  noDecimal?: boolean;
  decimal?: number;
}

export const ETH_UNITS = unitMap as unknown as Units;

export function getUnit(num: number): Unit {
  const str = Math.pow(10, num).toString();
  const [key] = Object.entries(ETH_UNITS).find(([_, value]) => value === str) as [Unit, string];

  return key;
}

export function accuracyFormat(num: BigNumber.Value, accuracy: number | string) {
  if (accuracy) {
    return bn2str(bnShift(num, -accuracy));
  } else if (+accuracy === 0) {
    return num;
  } else {
    return '';
  }
}

export function bnShift(num: BigNumber.Value, shift: number | string) {
  shift = parseInt(shift as string, 10);

  return new BigNumber(num).shiftedBy(shift).toNumber();
}

export function bn2str(num: BigNumber.Value) {
  return new BigNumber(num).toString(10);
}

// eslint-disable-next-line complexity
const toStr = (value: WeiValue): string => {
  if (BN.isBN(value)) {
    return value.toString();
  } else if (isString(value)) {
    return value;
  } else if (isNumber(value)) {
    return String(value);
  } else if (isUndefined(value) || isNull(value) || isNaN(value)) {
    return '0';
  } else {
    throw new TypeError(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Can not convert the value ${value} to String type. Value type is ${typeof value}`
    );
  }
};

const isDecimal = (value: number | string) => {
  return /\d+\.\d+/.test(String(value));
};

// eslint-disable-next-line complexity
export function prettyNumber(
  value: string | number | BN | null | undefined,
  { decimal, noDecimal }: PrettyNumberOptions = { decimal: 3, noDecimal: false }
): string {
  if (value === null || typeof value === 'undefined') {
    return '-';
  }

  if (typeof value === 'number' || BN.isBN(value)) {
    value = value.toString();
  }

  const isDecimalNumber = isDecimal(value);
  let prefix = isDecimalNumber ? value.split('.')[0] : value;
  const suffix = isDecimalNumber
    ? completeDecimal(value.split('.')[1], decimal as number)
    : new Array(decimal).fill(0).join('');

  prefix = prefix.replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g, '$&,');

  const result = !noDecimal && +suffix !== 0 ? `${prefix}.${suffix}` : prefix;

  return +result === 0 ? '0' : result;
}

export function fromWei(
  { value, unit = 'ether' }: { value: WeiValue; unit?: Unit },
  ...fns: ((value: string) => string)[]
): string {
  return [toStr, (val: string) => Web3.utils.fromWei(val || '0', unit), ...fns].reduce(
    (acc, fn) => fn(acc as string),
    value
  ) as string;
}

export function toWei(
  { value, unit = 'ether' }: { value: WeiValue; unit?: Unit },
  ...fns: ((value: string) => string)[]
): string {
  return [toStr, (val: string) => Web3.utils.toWei(val || '0', unit), ...fns].reduce(
    (acc, fn) => fn(acc as string),
    value
  ) as string;
}

const completeDecimal = (value: string, bits: number): string => {
  const length = value.length;

  if (length > bits) {
    return value.substr(0, bits);
  } else if (length < bits) {
    return value + new Array(bits - length).fill('0').join('');
  } else {
    return value;
  }
};
