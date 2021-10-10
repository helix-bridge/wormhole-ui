import React, { useCallback } from 'react';
import { RegisterStatus } from '../../config';
import { BridgeFormProps, DVMTransfer, NetConfig } from '../../model';
import { redeemErc20 } from '../../utils';
import { DVM } from './Smart';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Tx section-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: ropsten -> pangolin dvm
 */
export function Ethereum2DarwiniaDVM({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const spenderResolver = useCallback(
    (config: NetConfig) => Promise.resolve(config.tokenContract.issuingDarwinia ?? ''),
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
