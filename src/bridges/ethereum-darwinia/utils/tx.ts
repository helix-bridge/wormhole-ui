import { ApiPromise } from '@polkadot/api';
import { decodeAddress } from '@polkadot/util-crypto';
import { Observable } from 'rxjs';
import { abi } from '../../../config/abi';
import { PolkadotChainConfig, Tx, TxFn } from '../../../model';
import { buf2hex, genEthereumContractTxObs, getBridge, isKton, isRing, signAndSendExtrinsic } from '../../../utils';
import {
  EthereumDarwiniaBridgeConfig,
  IssuingDarwiniaTxPayload,
  RedeemDarwiniaTxPayload,
  RedeemDepositTxPayload,
} from '../model';

/**
 * @description darwinia <- ethereum
 * Because of the ring was released in advance on ethereum, so the action is issuing, but follow the Protocol Overview, it should be redeem.
 */
export const redeemDarwiniaToken: TxFn<RedeemDarwiniaTxPayload> = ({ sender, direction, asset, amount, recipient }) => {
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
export const redeemDeposit: TxFn<RedeemDepositTxPayload> = ({ direction, recipient, sender, deposit }) => {
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
 * @description darwinia -> ethereum
 */
export function issuingDarwiniaTokens(value: IssuingDarwiniaTxPayload, api: ApiPromise): Observable<Tx> {
  const { sender, recipient, assets } = value;
  const { amount: ring } = assets.find((item) => isRing(item.asset)) || { amount: '0' };
  const { amount: kton } = assets.find((item) => isKton(item.asset)) || { amount: '0' };
  const extrinsic = api.tx.ethereumBacking.lock(ring, kton, recipient);

  return signAndSendExtrinsic(api, sender, extrinsic);
}
