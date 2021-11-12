import { useCallback } from 'react';
import { RegisterStatus } from '../../config';
import { BridgeFormProps, CrabConfig, DVMTransfer, ChainConfig, PangolinConfig } from '../../model';
import { issuingErc20 } from '../../utils';
import { DVM } from './DVM';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/**
 * TODO: Functions need to implement:
 * 1. getFee
 */

/* ----------------------------------------------Tx section-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangolin dvm -> ropsten
 */
export function DarwiniaDVM2Ethereum({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const spenderResolver = useCallback(
    (config: ChainConfig) => Promise.resolve((config as PangolinConfig | CrabConfig).contracts.e2dvm.issuing ?? ''),
    []
  );

  return (
    <DVM
      form={form}
      setSubmit={setSubmit}
      transform={issuingErc20}
      spenderResolver={spenderResolver}
      canRegister
      tokenRegisterStatus={RegisterStatus.unregister}
    />
  );
}
