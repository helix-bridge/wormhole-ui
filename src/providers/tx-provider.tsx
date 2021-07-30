import React, { createContext, useEffect, useMemo, useState } from 'react';
import { delay, Observer, of } from 'rxjs';
import { TxStatus } from '../components/TxStatus';
import { LONG_DURATION } from '../config';
import { Tx } from '../model';

type TxError = Record<string, unknown> | null;

export interface TxCtx {
  setTx: (tx: Tx | null) => void;
  tx: Tx | null;
  setError: (error: TxError) => void;
  error: TxError;
  observer: Observer<Tx>;
}

export const TxContext = createContext<TxCtx | null>(null);

export const TxProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [tx, setTx] = useState<Tx | null>(null);
  const [error, setError] = useState<TxError>(null);
  const observer = useMemo<Observer<Tx>>(() => {
    return {
      next: setTx,
      error: setError,
      complete: () => {
        console.info('[ tx completed! ]');
      },
    };
  }, []);

  useEffect(() => {
    if (tx?.status === 'finalized') {
      of(null).pipe(delay(LONG_DURATION)).subscribe(setTx);
    }
  }, [tx]);

  return (
    <TxContext.Provider value={{ setTx, tx, error, setError, observer }}>
      {children}
      <TxStatus tx={tx} />
    </TxContext.Provider>
  );
};
