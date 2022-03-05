import { useCallback } from 'react';
import { RegisterStatus } from '../../config';
import { CrossChainComponentProps, CrossChainDirection, DVMPayload, EthereumDVMBridgeConfig } from '../../model';
import { getBridge, issuingErc20 } from '../../utils';
import { DVM } from '../DVM/DVM';

/**
 * TODO: Functions need to implement:
 * 1. getFee
 */

/**
 * @description test chain: pangolin dvm -> ropsten
 */
export function DarwiniaDVM2Ethereum({ form, setSubmit, direction }: CrossChainComponentProps<DVMPayload>) {
  const spenderResolver = useCallback((dir: CrossChainDirection) => {
    const bridget = getBridge<EthereumDVMBridgeConfig>(dir);

    return Promise.resolve(bridget.config.contracts.issuing ?? '');
  }, []);

  return (
    <DVM
      form={form}
      direction={direction}
      setSubmit={setSubmit}
      transform={issuingErc20}
      spenderResolver={spenderResolver}
      canRegister
      tokenRegisterStatus={RegisterStatus.unregister}
    />
  );
}
