import { createContext, useState } from 'react';
import { NetConfig } from '../model';

export interface DepartureState {
  from?: NetConfig;
  sender?: string;
}

export interface DepartureCtx {
  departure: DepartureState;
  updateDeparture: (data: DepartureState) => void;
}

export const DepartureContext = createContext<DepartureCtx | null>(null);

export const DepartureProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [departure, updateDeparture] = useState<DepartureState>({});

  return <DepartureContext.Provider value={{ departure, updateDeparture }}>{children}</DepartureContext.Provider>;
};
