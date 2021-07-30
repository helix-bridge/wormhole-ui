import { useContext } from 'react';
import { TxContext, TxCtx } from '../providers';

export const useTx = () => useContext(TxContext) as Exclude<TxCtx, null>;
