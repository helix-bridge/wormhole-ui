import { useCallback } from 'react';
import { RegisterStatus } from '../../config/constant';
import { CrossChainComponentProps, CrossChainDirection } from '../../model';
import { getBridge } from '../../utils';
import { DVM } from '../DVM/DVM';
import { EthereumDVMBridgeConfig, Erc20Payload } from './model';
import { issuing } from './utils';

/**
 * TODO: Functions need to implement:
 * 1. getFee
 */

/**
 * @description test chain: pangolin dvm -> ropsten
 */
export function DarwiniaDVM2Ethereum({ form, setSubmit, direction }: CrossChainComponentProps<Erc20Payload>) {
  const spenderResolver = useCallback((dir: CrossChainDirection) => {
    const bridget = getBridge<EthereumDVMBridgeConfig>(dir);

    return Promise.resolve(bridget.config.contracts.issuing ?? '');
  }, []);

  return (
    <DVM
      form={form}
      direction={direction}
      setSubmit={setSubmit}
      transform={issuing}
      spenderResolver={spenderResolver}
      canRegister
      tokenRegisterStatus={RegisterStatus.unregister}
    />
  );
}
