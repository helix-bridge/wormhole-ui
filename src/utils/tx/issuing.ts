import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import BN from 'bn.js';
import { from, Observable, Observer, switchMap, switchMapTo, tap } from 'rxjs';
import { getBridge } from '..';
import { abi } from '../../config';
import {
  IssuingDarwiniaToken,
  IssuingDVMToken,
  IssuingSubstrateToken,
  SubstrateSubstrateDVMBridgeConfig,
  Tx,
} from '../../model';
import { isKton, isRing } from '../helper/validator';
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

/**
 * @description darwinia -> ethereum
 */
export function issuingDarwiniaTokens(value: IssuingDarwiniaToken, api: ApiPromise): Observable<Tx> {
  const { sender, recipient, assets } = value;
  const { amount: ring } = assets.find((item) => isRing(item.asset)) || { amount: '0' };
  const { amount: kton } = assets.find((item) => isKton(item.asset)) || { amount: '0' };
  const obs = new Observable((observer: Observer<Tx>) => {
    api.tx.ethereumBacking
      .lock(ring, kton, recipient)
      .signAndSend(sender, extrinsicSpy(observer))
      .catch((error) => {
        observer.error({ status: 'error', error });
      });
  });

  return from(web3FromAddress(sender)).pipe(
    tap((injector) => api.setSigner(injector.signer)),
    switchMapTo(obs)
  );
}

/**
 * @description substrate -> substrate dvm
 */
export function issuingSubstrateToken(value: IssuingSubstrateToken, api: ApiPromise, fee: BN): Observable<Tx> {
  const { sender, recipient, amount, direction } = value;
  const bridge = getBridge<SubstrateSubstrateDVMBridgeConfig>(direction);
  const WEIGHT = '1509000000';
  const obs = new Observable((observer: Observer<Tx>) => {
    try {
      const module = direction.from.isTest ? 'substrate2SubstrateBacking' : 'toCrabBacking';

      api.tx[module]
        .lockAndRemoteIssue(String(bridge.config.specVersion), WEIGHT, amount, fee, recipient)
        .signAndSend(sender, extrinsicSpy(observer))
        .catch((error) => {
          observer.error({ status: 'error', error });
        });
    } catch (err) {
      observer.error({ status: 'error', error: (err as Record<string, string>).message });
    }
  });

  return from(web3FromAddress(sender)).pipe(
    tap((injector) => api.setSigner(injector.signer)),
    switchMapTo(obs)
  );
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
