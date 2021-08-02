import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { from, Observable, Observer, switchMapTo, tap } from 'rxjs';
import { D2E, DeepRequired, NoNullTransferNetwork, TransferFormValues, Tx } from '../../model';

export type BackingLockNative = TransferFormValues<
  DeepRequired<D2E, ['sender' | 'assets' | 'recipient']>,
  NoNullTransferNetwork
>;

export type BackingLockERC20 = TransferFormValues<
  DeepRequired<D2E, ['sender' | 'asset' | 'recipient' | 'amount']>,
  NoNullTransferNetwork
>;

function extrinsicSpy(observer: Observer<Tx>) {
  observer.next({ status: 'signing' });

  // eslint-disable-next-line complexity
  return async (result: SubmittableResult) => {
    if (!result || !result.status) {
      return;
    }
    console.info('%c [ result.status ]-22', 'font-size:13px; background:pink; color:blue;', result.status.toJSON());

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

export function backingLock(value: BackingLockNative, api: ApiPromise): Observable<Tx> {
  const { sender, recipient, assets } = value;
  const { amount: ring } = assets.find((item) => item.asset === 'ring') || { amount: '0' };
  const { amount: kton } = assets.find((item) => item.asset === 'kton') || { amount: '0' };
  const obs = new Observable((observer: Observer<Tx>) => {
    api.tx.ethereumBacking.lock(ring, kton, recipient).signAndSend(sender, extrinsicSpy(observer));
  });

  return from(web3FromAddress(sender)).pipe(
    tap((injector) => api.setSigner(injector.signer)),
    switchMapTo(obs)
  );
}
