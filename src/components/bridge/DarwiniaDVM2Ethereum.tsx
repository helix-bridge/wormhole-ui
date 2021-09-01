import { BridgeFormProps, DVMTransfer } from '../../model';
import { DVM } from './Dvm';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/**
 * TODO: Functions need to implement:
 * 1. getFee
 */

/* ----------------------------------------------Tx section-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

export function DarwiniaDVM2Ethereum({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  return <DVM form={form} setSubmit={setSubmit} isRedeem={false} />;
}
