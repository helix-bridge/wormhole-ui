import { useCallback } from 'react';
import { from, switchMap } from 'rxjs';
import { RegisterStatus } from '../../../config';
import {
  ChainConfig,
  CrossChainComponentProps,
  CrossChainDirection,
  DailyLimit,
  DVMPayload,
  DVMToken,
  MappedToken,
  SubstrateSubstrateDVMBridgeConfig,
} from '../../../model';
import { entrance, fromWei, getBridge, getS2SMappingParams, redeemSubstrate, waitUntilConnected } from '../../../utils';
import { DVM } from '../DVM';

/* ----------------------------------------------Base info helpers-------------------------------------------------- */

/* ----------------------------------------------Main Section-------------------------------------------------- */

/**
 * @description test chain: pangolin dvm -> pangoro
 */
export function SubstrateDVM2Substrate({ form, setSubmit, direction }: CrossChainComponentProps<DVMPayload>) {
  const transform = useCallback(
    (value: DVMToken) => {
      const bridge = getBridge<SubstrateSubstrateDVMBridgeConfig>(direction);

      return from(getS2SMappingParams(value.direction.from.provider.rpc)).pipe(
        switchMap(({ mappingAddress }) => redeemSubstrate(value, mappingAddress, String(bridge.config.specVersion)))
      );
    },
    [direction]
  );

  const getSpender = useCallback(async (dir: CrossChainDirection) => {
    const { mappingAddress } = await getS2SMappingParams(dir.from.provider.rpc);

    return mappingAddress;
  }, []);

  const getDailyLimit = useCallback(
    async (_: MappedToken) => {
      const { to: arrival } = direction;
      const api = entrance.polkadot.getInstance(arrival.provider.rpc);

      await waitUntilConnected(api);

      // TODO: querying should rely on token info.
      const module = arrival.isTest ? 'substrate2SubstrateBacking' : 'toCrabBacking';
      const [spentToday, limit] = (await api.query[module].secureLimitedRingAmount()).toJSON() as [number, number];

      return { spentToday, limit } as DailyLimit;
    },
    [direction]
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
      direction={direction}
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
