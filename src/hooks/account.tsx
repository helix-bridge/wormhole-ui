import { useContext } from 'react';
import { AccountContext, AccountCtx } from '../providers/account-provider';

export const useAccount = () => useContext(AccountContext) as Exclude<AccountCtx, null>;
