import { useApi } from '../hooks';
import { isPolkadotNetwork } from '../utils';
import { ShortAccount } from './ShortAccount';

// eslint-disable-next-line complexity
export function Connection() {
  const { network, networkStatus, accounts } = useApi();

  if (networkStatus !== 'success' || isPolkadotNetwork(network) || !accounts?.length) {
    return null;
  }

  return (
    <div className="rounded-3xl flex items-center dark:bg-gray-800 bg-gray-100 h-10 px-4">
      <img src="image/metamask-fox.svg" className="h-6 mr-2" />
      <ShortAccount account={accounts[0].address} className="h-full" />
    </div>
  );
}
