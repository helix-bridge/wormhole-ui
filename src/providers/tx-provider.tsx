import React, { createContext, useEffect, useMemo, useState } from 'react';
import { delay, Observer, of } from 'rxjs';
import { TxStatus } from '../components/TxStatus';
import { LONG_DURATION } from '../config';
import { Tx } from '../model';

export interface TxCtx {
  setTx: (tx: Tx | null) => void;
  tx: Tx | null;
  observer: Observer<Tx>;
}

export const TxContext = createContext<TxCtx | null>(null);

export const TxProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [tx, setTx] = useState<Tx | null>(null);
  const observer = useMemo<Observer<Tx>>(() => {
    return {
      next: setTx,
      error: setTx,
      complete: () => {
        console.info('[ tx completed! ]');
      },
    };
  }, []);

  useEffect(() => {
    if (tx?.status === 'finalized' || tx?.status === 'error') {
      of(null).pipe(delay(LONG_DURATION)).subscribe(setTx);
    }
  }, [tx]);

  return (
    <TxContext.Provider value={{ setTx, tx, observer }}>
      {children}
      <TxStatus tx={tx} onClose={() => setTx(null)} />
    </TxContext.Provider>
  );
};
