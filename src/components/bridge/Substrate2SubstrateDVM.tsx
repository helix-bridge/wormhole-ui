import { BridgeFormProps, DVMTransfer } from '../../model';
import { DVM } from './Dvm';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Tx section-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangoro -> pangolin dvm
 */
export function Substrate2SubstrateDVM({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  return <DVM form={form} setSubmit={setSubmit} isRedeem={false} />;
}
