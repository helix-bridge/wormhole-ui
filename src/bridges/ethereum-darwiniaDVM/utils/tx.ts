import { Observable, from, switchMap } from 'rxjs';
import { abi } from '../../../config/abi';
import { DVMTxPayload, Tx, TxFn } from '../../../model';
import { genEthereumContractTxObs, getBridge, getErc20MappingPrams } from '../../../utils';
import { EthereumDVMBridgeConfig } from '../model';

export const redeemErc20: TxFn<DVMTxPayload> = (value) => {
  const { asset, recipient, amount, direction, sender } = value;
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const { address } = asset;

  return genEthereumContractTxObs(
    bridge.config.contracts.redeem,
    (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
    abi.bankErc20ABI
  );
};

export function issuingErc20(value: DVMTxPayload): Observable<Tx> {
  const { asset, recipient, amount, direction: transfer, sender } = value;
  const { address } = asset;

  return from(getErc20MappingPrams(transfer.from.provider.rpc)).pipe(
    switchMap(({ mappingAddress }) =>
      genEthereumContractTxObs(
        mappingAddress,
        (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
        abi.Erc20MappingTokenABI
      )
    )
  );
}
