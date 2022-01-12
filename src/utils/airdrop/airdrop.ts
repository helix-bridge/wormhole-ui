import BN from 'bn.js';
import Web3 from 'web3';
import genesisData from '../../config/genesis.json';
import { Network } from '../../model';

export function getAirdropData(account: string, network: Network): BN {
  if (!account) {
    return Web3.utils.toBN(0);
  }

  if (network === 'ethereum') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source = genesisData as any;
    const dotAirdropNumber = Web3.utils.toBN(source.dot[account] || 0);
    const ethAirdropNumber = Web3.utils.toBN(source.eth[account] || 0);

    return dotAirdropNumber.add(ethAirdropNumber);
  }

  return Web3.utils.toBN(0);
}
