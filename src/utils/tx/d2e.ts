import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { from, Observable, Observer, switchMapTo, tap } from 'rxjs';
import {
  Darwinia2EthereumTransfer,
  DeepRequired,
  Ethereum2DarwiniaTransfer,
  NoNullTransferNetwork,
  TransferFormValues,
  Tx,
} from '../../model';

export type IssuingDarwiniaToken = TransferFormValues<
  DeepRequired<Darwinia2EthereumTransfer, ['sender' | 'assets' | 'recipient']>,
  NoNullTransferNetwork
>;

export type IssuingSubstrateToken = TransferFormValues<
  DeepRequired<Ethereum2DarwiniaTransfer, ['sender' | 'asset' | 'amount' | 'recipient']>,
  NoNullTransferNetwork
>;

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

export function issuingDarwiniaTokens(value: IssuingDarwiniaToken, api: ApiPromise): Observable<Tx> {
  const { sender, recipient, assets } = value;
  const { amount: ring } = assets.find((item) => item.asset === 'ring') || { amount: '0' };
  const { amount: kton } = assets.find((item) => item.asset === 'kton') || { amount: '0' };
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

export const ISSUING_SUBSTRATE_FEE = '50000000000';

export function issuingSubstrateToken(
  value: IssuingSubstrateToken,
  api: ApiPromise,
  fee = ISSUING_SUBSTRATE_FEE
): Observable<Tx> {
  const { sender, recipient, amount } = value;
  const WEIGHT = '40544000';
  const obs = new Observable((observer: Observer<Tx>) => {
    try {
      const specVersion = api.runtimeVersion.specVersion.toString();
      console.info(api.tx.substrate2SubstrateBacking.lockAndRemoteIssue.meta.toHuman(), specVersion);
      api.tx.substrate2SubstrateBacking
        .lockAndRemoteIssue(specVersion, WEIGHT, amount, fee, recipient)
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
