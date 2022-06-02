import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types/types';
import BN from 'bn.js';
import { last } from 'lodash';
import { from, map, Observable, switchMap } from 'rxjs';
import Web3 from 'web3';
import { abi } from '../../../config';
import { CrossChainDirection, DVMChainConfig, PolkadotChainConfig } from '../../../model';
import { Tx } from '../../../model/tx';
import {
  convertToDvm,
  entrance,
  fromWei,
  genEthereumContractTxObs,
  signAndSendExtrinsic,
  toWei,
  waitUntilConnected,
} from '../../../utils';
import { IssuingSubstrateTxPayload, RedeemSubstrateTxPayload } from '../model';

export function issuing(value: IssuingSubstrateTxPayload, api: ApiPromise, fee: BN): Observable<Tx> {
  const { sender, recipient, amount, direction } = value;
  const { from: departure, to } = direction as CrossChainDirection<PolkadotChainConfig, DVMChainConfig>;
  const WEIGHT = '4000000000';
  const module = departure.isTest ? 'substrate2SubstrateBacking' : 'toCrabBacking';
  const extrinsic = api.tx[module].lockAndRemoteIssue(String(to.specVersion), WEIGHT, amount, fee, recipient);

  return signAndSendExtrinsic(api, sender, extrinsic);
}

export function redeem(value: RedeemSubstrateTxPayload, mappingAddress: string, specVersion: string): Observable<Tx> {
  const { asset, amount, sender, recipient, direction: transfer } = value;
  const receiver = Web3.utils.hexToBytes(convertToDvm(recipient));
  const WEIGHT = '690133000';
  const api = entrance.polkadot.getInstance(transfer.from.provider.rpc);

  const valObs = from(waitUntilConnected(api)).pipe(
    switchMap(() => {
      const section = transfer.to.isTest ? `${transfer.to.name}FeeMarket` : 'feeMarket';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (api.query as any)[section]['assignedRelayers']().then((data: Codec) => data.toJSON()) as Promise<
        { id: string; collateral: number; fee: number }[]
      >;
    }),
    map((res) => {
      const num = fromWei({ value: last(res)?.fee.toString(), unit: 'gwei' });

      return Web3.utils.toHex(toWei({ value: num, unit: 'ether' }));
    })
  );

  return valObs.pipe(
    switchMap((val) =>
      genEthereumContractTxObs(
        mappingAddress,
        (contract) =>
          contract.methods
            .burnAndRemoteUnlockWaitingConfirm(specVersion, WEIGHT, asset.address, receiver, amount)
            .send({ from: sender, value: val }),
        abi.S2SMappingTokenABI
      )
    )
  );
}
