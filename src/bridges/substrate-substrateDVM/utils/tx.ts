import { ApiPromise } from '@polkadot/api';
import BN from 'bn.js';
import { from, map, Observable, switchMap } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../../../config';
import { Tx } from '../../../model/tx';
import {
  convertToDvm,
  entrance,
  fromWei,
  genEthereumContractTxObs,
  getBridge,
  signAndSendExtrinsic,
  toWei,
  waitUntilConnected,
} from '../../../utils';
import { IssuingSubstrateTxPayload, RedeemSubstrateTxPayload, SubstrateSubstrateDVMBridgeConfig } from '../model';

export function issuingSubstrateToken(value: IssuingSubstrateTxPayload, api: ApiPromise, fee: BN): Observable<Tx> {
  const { sender, recipient, amount, direction } = value;
  const bridge = getBridge<SubstrateSubstrateDVMBridgeConfig>(direction);
  const WEIGHT = '1509000000';
  const module = direction.from.isTest ? 'substrate2SubstrateBacking' : 'toCrabBacking';
  const extrinsic = api.tx[module].lockAndRemoteIssue(
    String(bridge.config.specVersion),
    WEIGHT,
    amount,
    fee,
    recipient
  );

  return signAndSendExtrinsic(api, sender, extrinsic);
}

export function redeemSubstrate(
  value: RedeemSubstrateTxPayload,
  mappingAddress: string,
  specVersion: string
): Observable<Tx> {
  const { asset, amount, sender, recipient, direction: transfer } = value;
  const receiver = Web3.utils.hexToBytes(convertToDvm(recipient));
  const weight = '690133000';
  const api = entrance.polkadot.getInstance(transfer.from.provider.rpc);
  const valObs = from(waitUntilConnected(api)).pipe(
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
