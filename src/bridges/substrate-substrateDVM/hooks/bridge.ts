import { useEffect, useState } from 'react';
import { from } from 'rxjs';
import { CrossChainDirection, PolkadotChainConfig } from '../../../model';
import { getS2SMappingParams } from '../../../utils';

export function useBridgeStatus(direction: CrossChainDirection<PolkadotChainConfig, PolkadotChainConfig>) {
  const [specVersionOnline, setSpecVersionOnline] = useState<string>('');
  const { to } = direction;

  useEffect(() => {
    const sub$$ = from(getS2SMappingParams(to.provider.rpc)).subscribe((res) => {
      const { specVersion } = res;

      setSpecVersionOnline(specVersion);
    });

    return () => sub$$.unsubscribe();
  }, [to.provider.rpc]);

  return { isAvailable: to.specVersion === +specVersionOnline, specVersionOnline };
}
