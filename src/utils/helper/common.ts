import { EMPTY } from 'rxjs';

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export function empty(...args: any[]) {
  // nothing to do
}

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export function emptyObsFactory() {
  return EMPTY.subscribe();
}

export function truth(): true {
  return true;
}
