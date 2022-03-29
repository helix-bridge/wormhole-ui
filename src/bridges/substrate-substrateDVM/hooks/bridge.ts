import { useEffect, useState } from 'react';
import { from } from 'rxjs';
import { CrossChainDirection, PolkadotChainConfig } from '../../../model';
import { entrance, waitUntilConnected } from '../../../utils';

export function useBridgeStatus(direction: CrossChainDirection<PolkadotChainConfig, PolkadotChainConfig>) {
  const [specVersionOnline, setSpecVersionOnline] = useState<string>('');
  const { to } = direction;

  useEffect(() => {
    const api = entrance.polkadot.getInstance(to.provider.rpc);

    const sub$$ = from(waitUntilConnected(api)).subscribe(() => {
      setSpecVersionOnline(api.runtimeVersion.specVersion.toString());
    });

    return () => sub$$.unsubscribe();
  }, [to.provider.rpc]);

  return { isAvailable: to.specVersion === +specVersionOnline, specVersionOnline };
}
