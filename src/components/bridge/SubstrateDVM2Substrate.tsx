import { useCallback } from 'react';
import { from, switchMap } from 'rxjs';
import { RegisterStatus } from '../../config';
import { BridgeFormProps, DVMToken, DVMTransfer, ChainConfig } from '../../model';
import { getS2SMappingParams, getUnit, redeemSubstrate, toWei } from '../../utils';
import { DVM } from './DVM';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangolin dvm -> pangoro
 */
export function SubstrateDVM2Substrate({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const transform = useCallback((value: DVMToken) => {
    return from(getS2SMappingParams(value.transfer.from.provider.rpc)).pipe(
      switchMap(({ mappingAddress, specVersion }) =>
        redeemSubstrate(
          {
            ...value,
            amount: toWei({
              value: value.amount,
              unit: getUnit(+value.asset.decimals) || 'gwei',
            }),
          },
          mappingAddress,
          specVersion
        )
      )
    );
  }, []);

  const getSpender = useCallback(async (config: ChainConfig) => {
    const { mappingAddress } = await getS2SMappingParams(config.provider.rpc);

    return mappingAddress;
  }, []);

  return (
    <DVM
      form={form}
      setSubmit={setSubmit}
      transform={transform}
      canRegister={false}
      spenderResolver={getSpender}
      tokenRegisterStatus={RegisterStatus.registered}
      approveOptions={{ gas: '21000000', gasPrice: '50000000000' }}
      isDVM={false}
    />
  );
}
