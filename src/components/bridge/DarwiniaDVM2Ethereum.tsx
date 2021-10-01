import { useCallback } from 'react';
import { RegisterStatus } from '../../config';
import { BridgeFormProps, DVMTransfer, NetConfig } from '../../model';
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
    (config: NetConfig) => Promise.resolve(config.tokenContract.issuingDarwinia ?? ''),
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
