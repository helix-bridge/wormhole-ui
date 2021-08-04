import { PropsWithChildren } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { Path } from '../config/routes';
import { useDeparture } from '../hooks';
import { RecordsParam } from '../model';
import { genRecordsParams } from '../utils';

export function HistoryLink({
  network,
  sender,
  state,
  children,
}: PropsWithChildren<Partial<LinkProps & RecordsParam>>) {
  const { departure } = useDeparture();
  const base = Path.history;
  const { from, sender: payer } = departure;
  const query = genRecordsParams({
    network: network || from?.name,
    sender: sender || payer,
    state,
  });

  return <Link to={`${base}?${query}`}>{children}</Link>;
}
