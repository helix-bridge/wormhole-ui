import { useEffect, useRef } from 'react';

export function useIsMounted() {
  const ref = useRef(true);

  useEffect(
    () => () => {
      ref.current = false;
    },
    []
  );

  return ref.current;
}
