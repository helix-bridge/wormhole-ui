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
import { entrance, fromWei, getS2SMappingParams, redeemSubstrate, waitUntilConnected } from '../../utils';
import { DVM } from './DVM';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangolin dvm -> pangoro
 */
export function SubstrateDVM2Substrate({ form, setSubmit }: BridgeFormProps<DVMTransfer>) {
  const transform = useCallback((value: DVMToken) => {
    return from(getS2SMappingParams(value.transfer.from.provider.rpc)).pipe(
      switchMap(({ mappingAddress }) =>
        redeemSubstrate(value, mappingAddress, value.transfer.from.name === 'crab' ? '1180' : '27020')
      )
    );
  }, []);

  const getSpender = useCallback(async (config: ChainConfig) => {
    const { mappingAddress } = await getS2SMappingParams(config.provider.rpc);

    return mappingAddress;
  }, []);

  const getDailyLimit = useCallback(
    async (_: MappedToken) => {
      const arrival = form.getFieldValue(FORM_CONTROL.transfer).to as PolkadotConfig<ApiKeys>;
      const api = entrance.polkadot.getInstance(arrival.provider.rpc);

      await waitUntilConnected(api);

      // TODO: querying should rely on token info.
      const module = arrival.isTest ? 'substrate2SubstrateBacking' : 'toCrabBacking';
      const [spentToday, limit] = (await api.query[module].secureLimitedRingAmount()).toJSON() as [number, number];

      return { spentToday, limit } as DailyLimit;
    },
    [form]
  );

  const getFee = useCallback(async (config: ChainConfig) => {
    const api = entrance.polkadot.getInstance(config.provider.rpc);

    await waitUntilConnected(api);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = (await (api.rpc as any).fee.marketFee()) as { amount: string };
    const num = fromWei({ value: res.amount.toString(), unit: 'gwei' });

    return num;
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
      getDailyLimit={getDailyLimit}
      getFee={getFee}
      isDVM={false}
    />
  );
}
