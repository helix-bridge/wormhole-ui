import { useEffect, useState } from 'react';
import { Erc20Token } from '../model';

export function useLocalSearch(filterFn: (addr: string) => Erc20Token[]) {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Erc20Token[]>([]);

  useEffect(() => {
    const result = filterFn(search);

    setData(result);
  }, [filterFn, search]);

  return { search, setSearch, data };
}
