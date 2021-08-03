import { Button, message, notification } from 'antd';
import { Trans } from 'react-i18next';
import { Observable, Observer } from 'rxjs';
import { MetamaskError, Network } from '../../model';
import { addEthereumChain, isNativeMetamaskChain, switchEthereumChain } from './network';

export const switchMetamaskNetwork: (network: Network) => Observable<null> = (network: Network) => {
  const key = `key${Date.now()}`;

  return new Observable((observer: Observer<null>) => {
    notification.error({
      message: <Trans>Incorrect network</Trans>,
      description: (
        <Trans
          i18nKey="Network mismatch, you can switch network manually in metamask or do it automatically by clicking the button below"
          tOptions={{ type: network }}
        ></Trans>
      ),
      btn: (
        <Button
          type="primary"
          onClick={async () => {
            try {
              const isNative = isNativeMetamaskChain(network);
              const action = isNative ? switchEthereumChain : addEthereumChain;
              const res = await action(network);

              notification.close(key);
              observer.next(res);
            } catch (err: unknown) {
              message.error({
                content: (
                  <span>
                    <Trans>Network switch failed, please switch it in the metamask plugin!</Trans>
                    <span className="ml-2">{(err as MetamaskError).message}</span>
                  </span>
                ),
                duration: 5,
              });
            }
          }}
        >
          <Trans i18nKey="Switch to {{ network }}" tOptions={{ network }}></Trans>
        </Button>
      ),
      key,
      onClose: () => {
        notification.close(key);
        observer.complete();
      },
      duration: null,
    });
  });
};
