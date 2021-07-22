import React, { createContext, useEffect, useState } from 'react';
import { useApi } from '../hooks';
import { convertToSS58 } from '../utils';

export interface AccountCtx {
  account: string;
  setAccount: (account: string) => void;
}

export const AccountContext = createContext<AccountCtx | null>(null);

export const AccountProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [account, setAccount] = useState<string>('');
  const { networkConfig } = useApi();

  useEffect(() => {
    if (!account || !networkConfig?.ss58Prefix) {
      return;
    }

    const ss58Account = convertToSS58(account, networkConfig.ss58Prefix);

    setAccount(ss58Account);
  }, [account, networkConfig]);

  return (
    <AccountContext.Provider
      value={{
        setAccount,
        account,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
