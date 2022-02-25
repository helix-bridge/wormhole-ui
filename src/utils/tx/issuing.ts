import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { web3FromAddress } from '@polkadot/extension-dapp';
import BN from 'bn.js';
import { from, Observable, Observer, switchMap, switchMapTo, tap } from 'rxjs';
import { abi } from '../../config';
import {
  IssuingDarwiniaToken,
  IssuingDVMToken,
  IssuingSubstrateToken,
  SmartTxPayload,
  SubstrateSubstrateDVMBridgeConfig,
  Tx,
} from '../../model';
import { getBridge } from '../bridge';
import { dvmAddressToAccountId } from '../helper';
import { isKton, isRing } from '../helper/validator';
import { waitUntilConnected } from '../network';
import { getContractTxObs } from './common';
import { getErc20MappingPrams } from './redeem';

function extrinsicSpy(observer: Observer<Tx>) {
  observer.next({ status: 'signing' });

  // eslint-disable-next-line complexity
  return async (result: SubmittableResult) => {
    if (!result || !result.status) {
      return;
    }

    console.info('%c [ extrinsic status ]-22', 'font-size:13px; background:pink; color:blue;', result.status.toJSON());

    const { error, inBlock, finalized } = result.status.toJSON() as Record<string, string>;

    if (result.status.isBroadcast) {
      observer.next({ status: 'broadcast' });
    }

    if (result.status.isReady) {
      observer.next({ status: 'queued' });
    }

    if (result.status.isInBlock) {
      observer.next({ status: 'inblock', hash: inBlock });
    }

    if (result.status.isFinalized) {
      observer.next({ status: 'finalized', hash: finalized });
      observer.complete();
    }

    if (result.isError) {
      observer.error({ status: 'error', error });
    }
  };
}

export function signAndSendExtrinsic(
  api: ApiPromise,
  sender: string,
  extrinsic: SubmittableExtrinsic<'promise', SubmittableResult>
) {
  const obs = new Observable((spy: Observer<Tx>) => {
    waitUntilConnected(api!)
      .then(() => extrinsic.signAndSend(sender, extrinsicSpy(spy)))
      .catch((error) => {
        spy.error({ status: 'error', error });
      });
  });

  return from(web3FromAddress(sender)).pipe(
    tap((injector) => api.setSigner(injector.signer)),
    switchMapTo(obs)
  );
}

/**
 * @description darwinia -> ethereum
 */
export function issuingDarwiniaTokens(value: IssuingDarwiniaToken, api: ApiPromise): Observable<Tx> {
  const { sender, recipient, assets } = value;
  const { amount: ring } = assets.find((item) => isRing(item.asset)) || { amount: '0' };
  const { amount: kton } = assets.find((item) => isKton(item.asset)) || { amount: '0' };
  const extrinsic = api.tx.ethereumBacking.lock(ring, kton, recipient);

  return signAndSendExtrinsic(api, sender, extrinsic);
}

/**
 * @description substrate -> substrate dvm
 */
export function issuingSubstrateToken(value: IssuingSubstrateToken, api: ApiPromise, fee: BN): Observable<Tx> {
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

export function issuingFromSubstrate2DVM(value: SmartTxPayload, api: ApiPromise): Observable<Tx> {
  const { sender, recipient, amount, asset } = value;
  const toAccount = dvmAddressToAccountId(recipient).toHuman();
  const extrinsic = isRing(asset)
    ? api.tx.balances.transfer(toAccount, new BN(amount))
    : api.tx.kton.transfer(toAccount, new BN(amount));

  return signAndSendExtrinsic(api, sender, extrinsic);
}

/**
 * @description ethereum -> substrate dvm
 */
export function issuingErc20(value: IssuingDVMToken): Observable<Tx> {
  const { asset, recipient, amount, direction: transfer, sender } = value;
  const { address } = asset;

  return from(getErc20MappingPrams(transfer.from.provider.rpc)).pipe(
    switchMap(({ mappingAddress }) =>
      getContractTxObs(
        mappingAddress,
        (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
        abi.Erc20MappingTokenABI
      )
    )
  );
}
