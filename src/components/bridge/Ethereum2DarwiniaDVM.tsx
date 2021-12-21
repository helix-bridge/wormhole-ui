import { useCallback } from 'react';
import { RegisterStatus } from '../../config';
import { BridgeFormProps, DVMTransfer, ChainConfig, RopstenConfig } from '../../model';
import { redeemErc20 } from '../../utils';
import { DVM } from './DVM';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Tx section-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: ropsten -> pangolin dvm
 */
export function Ethereum2DarwiniaDVM({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const spenderResolver = useCallback(
    (config: ChainConfig) => Promise.resolve((config as RopstenConfig).contracts.e2dvm.issuing ?? ''),
    []
  );

  return (
    <DVM
      form={form}
      setSubmit={setSubmit}
      transform={redeemErc20}
      spenderResolver={spenderResolver}
      canRegister
      tokenRegisterStatus={RegisterStatus.unregister}
    />
  );
}
