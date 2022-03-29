import { Observable, from, switchMap } from 'rxjs';
import { abi } from '../../../config/abi';
import { Tx, TxFn } from '../../../model';
import { genEthereumContractTxObs, getBridge, getErc20MappingAddress } from '../../../utils';
import { EthereumDVMBridgeConfig, Erc20TxPayload } from '../model';

export const redeem: TxFn<Erc20TxPayload> = (value) => {
  const { asset, recipient, amount, direction, sender } = value;
  const bridge = getBridge<EthereumDVMBridgeConfig>(direction);
  const { address } = asset;

  return genEthereumContractTxObs(
    bridge.config.contracts.redeem,
    (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
    abi.bankErc20ABI
  );
};

export function issuing(value: Erc20TxPayload): Observable<Tx> {
  const { asset, recipient, amount, direction: transfer, sender } = value;
  const { address } = asset;

  return from(getErc20MappingAddress(transfer.from.provider.rpc)).pipe(
    switchMap((mappingAddress) =>
      genEthereumContractTxObs(
        mappingAddress,
        (contract) => contract.methods.crossSendToken(address, recipient, amount).send({ from: sender }),
        abi.Erc20MappingTokenABI
      )
    )
  );
}
