import { useApi } from '../hooks';
import { ShortAccount } from './ShortAccount';

export function ActiveAccount() {
  const {
    connection: { status, accounts, type },
  } = useApi();

  if (status !== 'success' || type !== 'metamask' || !accounts?.length) {
    return null;
  }

  return (
    <div className="rounded-3xl flex items-center md:dark:bg-gray-800 md:bg-gray-100 h-10 px-4">
      <img src="image/metamask-fox.svg" className="h-4 md:h-6 mr-2" />
      <ShortAccount account={accounts[0].address} className="h-full hidden md:flex pr-4 lg:pr-0" />
    </div>
  );
}
