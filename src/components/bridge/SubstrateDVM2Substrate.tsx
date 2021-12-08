import { useCallback } from 'react';
import { from, switchMap } from 'rxjs';
import { FORM_CONTROL, RegisterStatus } from '../../config';
import {
  ApiKeys,
  BridgeFormProps,
  ChainConfig,
  DailyLimit,
  DVMToken,
  DVMTransfer,
  MappedToken,
  PolkadotConfig,
} from '../../model';
import { entrance, getS2SMappingParams, redeemSubstrate, waitUntilConnected } from '../../utils';
import { DVM } from './DVM';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangolin dvm -> pangoro
 */
export function SubstrateDVM2Substrate({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const transform = useCallback((value: DVMToken) => {
    return from(getS2SMappingParams(value.transfer.from.provider.rpc)).pipe(
      switchMap(({ mappingAddress, specVersion }) => redeemSubstrate(value, mappingAddress, specVersion))
    );
  }, []);

  const getSpender = useCallback(async (config: ChainConfig) => {
    const { mappingAddress } = await getS2SMappingParams(config.provider.rpc);

    return mappingAddress;
  }, []);

  const getDailyLImit = useCallback(
    async (token: MappedToken) => {
      const arrival = form.getFieldValue(FORM_CONTROL.transfer).to as PolkadotConfig<ApiKeys>;
      const api = entrance.polkadot.getInstance(arrival.provider.rpc);

      // todo: remove reconnect
      if (!api.isConnected) {
        api.connect();
      }

      await waitUntilConnected(api);

      console.info('%c [ tokenAddress ]-29', 'font-size:13px; background:pink; color:#bf2c9f;', token);
      // TODO: querying should rely on token info.
      const [spentToday, limit] = (await api.query.substrate2SubstrateBacking.secureLimitedRingAmount()).toJSON() as [
        number,
        number
      ];

      return { spentToday, limit } as DailyLimit;
    },
    [form]
  );

  return (
    <DVM
      form={form}
      setSubmit={setSubmit}
      transform={transform}
      canRegister={false}
      spenderResolver={getSpender}
      tokenRegisterStatus={RegisterStatus.registered}
      approveOptions={{ gas: '21000000', gasPrice: '50000000000' }}
      getDailyLImit={getDailyLImit}
      isDVM={false}
    />
  );
}
