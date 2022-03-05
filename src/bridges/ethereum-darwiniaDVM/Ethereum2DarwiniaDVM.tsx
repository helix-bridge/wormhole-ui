import { useCallback } from 'react';
import { RegisterStatus } from '../../config';
import { CrossChainComponentProps, CrossChainDirection, DVMPayload } from '../../model';
import { getBridge } from '../../utils';
import { DVM } from '../DVM/DVM';
import { EthereumDVMBridgeConfig } from './model';
import { redeemErc20 } from './utils/tx';

export function Ethereum2DarwiniaDVM({ form, setSubmit, direction }: CrossChainComponentProps<DVMPayload>) {
  const spenderResolver = useCallback((dir: CrossChainDirection) => {
    const bridge = getBridge<EthereumDVMBridgeConfig>(dir);
    return Promise.resolve(bridge.config.contracts.issuing ?? '');
  }, []);

  return (
    <DVM
      form={form}
      direction={direction}
      setSubmit={setSubmit}
      transform={redeemErc20}
      spenderResolver={spenderResolver}
      canRegister
      tokenRegisterStatus={RegisterStatus.unregister}
    />
  );
}
