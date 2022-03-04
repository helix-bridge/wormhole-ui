import { TypeRegistry } from '@polkadot/types';
import { decodeAddress } from '@polkadot/util-crypto';
import { memoize } from 'lodash';
import { EMPTY, from as fromObs, map, Observable, switchMap } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../../config';
import {
  CrossChainDirection,
  DVMChainConfig,
  EthereumDarwiniaBridgeConfig,
  EthereumDVMBridgeConfig,
  PolkadotChainConfig,
  RedeemDarwiniaToken,
  RedeemDeposit,
  RedeemDVMToken,
  SmartTxPayload,
  Tx,
  TxFn,
} from '../../model';
import { getBridge } from '../bridge';
import { convertToDvm, convertToSS58, fromWei, isRing, toWei } from '../helper';
import { entrance, waitUntilConnected } from '../network';
import { buf2hex, genEthereumContractTxObs, genEthereumTransactionObs } from './common';

/**
 * @description darwinia <- ethereum
 * Because of the ring was released in advance on ethereum, so the action is issuing, but follow the Protocol Overview, it should be redeem.
 */
export const redeemDarwiniaToken: TxFn<RedeemDarwiniaToken> = ({ sender, direction, asset, amount, recipient }) => {
  const { to } = direction;
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  const contractAddress = bridge.config.contracts[asset.toLowerCase() as 'ring' | 'kton'] as string;

  recipient = buf2hex(decodeAddress(recipient, false, (to as PolkadotChainConfig).ss58Prefix).buffer);

  return genEthereumContractTxObs(contractAddress, (contract) =>
    contract.methods.transferFrom(sender, bridge.config.contracts.issuing, amount, recipient).send({ from: sender })
  );
};

/**
 * @description darwinia <- ethereum
 */
export const redeemDeposit: TxFn<RedeemDeposit> = ({ direction, recipient, sender, deposit }) => {
  const { to } = direction;
  const bridge = getBridge<EthereumDarwiniaBridgeConfig>(direction);
  recipient = buf2hex(decodeAddress(recipient, false, (to as PolkadotChainConfig).ss58Prefix!).buffer);

  return genEthereumContractTxObs(
    bridge.config.contracts.redeemDeposit,
    (contract) => contract.methods.burnAdnRedeem(deposit, recipient).send({ from: sender }),
    abi.bankABI
  );
};

/**
 * @description ethereum <- substrate dvm
 */
export const redeemErc20: TxFn<RedeemDVMToken> = (value) => {
  const { asset, recipient, amount, direction, sender } = value;
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const { address } = asset;

  return genEthereumContractTxObs(
    bridge.config.contracts.redeem,
    (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
    abi.bankErc20ABI
  );
};

/**
 * @description substrate <- substrate dvm
 */
export function redeemSubstrate(value: RedeemDVMToken, mappingAddress: string, specVersion: string): Observable<Tx> {
  const { asset, amount, sender, recipient, direction: transfer } = value;
  const receiver = Web3.utils.hexToBytes(convertToDvm(recipient));
  const weight = '690133000';
  const api = entrance.polkadot.getInstance(transfer.from.provider.rpc);
  const valObs = fromObs(waitUntilConnected(api)).pipe(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    switchMap(() => (api.rpc as any).fee.marketFee() as Promise<{ amount: string }>),
    map((res) => {
      const num = fromWei({ value: res.amount.toString(), unit: 'gwei' });

      return Web3.utils.toHex(toWei({ value: num, unit: 'ether' }));
    })
  );

  return valObs.pipe(
    switchMap((val) =>
      genEthereumContractTxObs(
        mappingAddress,
        (contract) =>
          contract.methods
            .burnAndRemoteUnlockWaitingConfirm(specVersion, weight, asset.address, receiver, amount)
            .send({ from: sender, value: val }),
        abi.S2SMappingTokenABI
      )
    )
  );
}

export function redeemFromDVM2Substrate(
  value: SmartTxPayload<DVMChainConfig>,
  direction: CrossChainDirection<DVMChainConfig, PolkadotChainConfig>
): Observable<Tx> {
  const registry = new TypeRegistry();
  const { recipient, asset, sender, amount } = value;
  const { from, to } = direction;
  const accountId = registry.createType('AccountId', convertToSS58(recipient, to.ss58Prefix)).toHex();

  if (accountId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return EMPTY;
  }

  if (isRing(asset)) {
    return genEthereumTransactionObs({
      from: sender,
      to: from.dvm.smartWithdrawRing,
      data: accountId,
      value: amount,
      gas: 55000,
    });
  }

  const withdrawalAddress = convertToDvm(recipient);

  return genEthereumContractTxObs(
    from.dvm.smartKton,
    (contract) => contract.methods.withdraw(withdrawalAddress, amount).send({ from: sender }),
    abi.ktonABI
  );
}

interface MappingInfo {
  specVersion?: string;
  mappingAddress: string;
}

type S2SInfo = Required<MappingInfo>;

const s2sMappingParams: (rpc: string) => Promise<S2SInfo> = async (rpc: string) => {
  const api = entrance.polkadot.getInstance(rpc);

  await waitUntilConnected(api);

  const module = rpc.includes('pangolin') ? api.query.substrate2SubstrateIssuing : api.query.fromDarwiniaIssuing;
  const mappingAddress = (await module.mappingFactoryAddress()).toString();
  const specVersion = api.runtimeVersion.specVersion.toString();

  return { specVersion, mappingAddress };
};

export const getS2SMappingParams = memoize(s2sMappingParams);

export const getErc20MappingPrams: (rpc: string) => Promise<MappingInfo> = (_: string) => {
  return Promise.resolve({ mappingAddress: '0xcB8531Bc0B7C8F41B55CF4E94698C37b130597B9' });
};
