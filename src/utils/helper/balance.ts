import BigNumber from 'bignumber.js';
import { Unit, unitMap, Units } from 'web3-utils';
import BN from 'bn.js';
import { isNull, isNumber, isString, isUndefined } from 'lodash';
import Web3 from 'web3';
import { ApiPromise } from '@polkadot/api';
import { AccountData, AccountInfo } from '@darwinia/types';
import { waitUntilConnected } from '../network';

export type WeiValue = string | BN | number | null | undefined;
export interface PrettyNumberOptions {
  withThousandSplit?: boolean;
  decimal?: number;
}

export const ETH_UNITS = unitMap as unknown as Units;

export function getUnit(num: number): Unit {
  const str = Math.pow(10, num).toString();
  try {
    const [key] = Object.entries(ETH_UNITS).find(([_, value]) => value === str) as [Unit, string];

    return key;
  } catch (err) {
    return 'ether';
  }
}

export function getPrecisionByUnit(unit: Unit): number {
  return ETH_UNITS[unit].length - 1;
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
    return value.replace(/,/g, '');
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
  { decimal }: PrettyNumberOptions = { decimal: 3 }
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

  const result = +suffix !== 0 ? `${prefix}.${suffix}` : prefix;

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

  return length > bits ? value.substr(0, bits) : value;
};

/**
 * @description other api can get balances:  api.derive.balances.all, api.query.system.account;
 * @see https://github.com/darwinia-network/wormhole-ui/issues/142
 */
export async function getDarwiniaAvailableBalances(api: ApiPromise, account = ''): Promise<[string, string]> {
  await waitUntilConnected(api);

  try {
    // type = 0 query ring balance.  type = 1 query kton balance.
    /* eslint-disable */
    const ringUsableBalance = await (api.rpc as any).balances.usableBalance(0, account);
    const ktonUsableBalance = await (api.rpc as any).balances.usableBalance(1, account);
    /* eslint-enable */

    return [ringUsableBalance.usableBalance.toString(), ktonUsableBalance.usableBalance.toString()];
  } catch (error: unknown) {
    console.warn(
      '%c [ Failed to  querying balance through rpc ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      (error as Record<string, string>).message
    );
  }

  try {
    const { data } = (await api.query.system.account(account)) as AccountInfo;
    const { free, freeKton } = data as unknown as AccountData;

    return [free.toString(), freeKton.toString()];
  } catch (error) {
    console.warn(
      '%c [ Failed to  querying balance through account info ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      (error as Record<string, string>).message
    );

    return ['0', '0'];
  }
}
