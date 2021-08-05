import { PropsWithChildren } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { Path } from '../config/routes';
import { useDeparture } from '../hooks';
import { HistoryRouteParam } from '../model';
import { genHistoryRouteParams } from '../utils';

export function HistoryLink({
  network,
  sender,
  state,
  children,
}: PropsWithChildren<Partial<LinkProps & HistoryRouteParam>>) {
  const { departure } = useDeparture();
  const base = Path.history;
  const { from, sender: payer } = departure;
  const query = genHistoryRouteParams({
    network: network || from?.name,
    sender: sender || payer,
    state,
  });

  return <Link to={`${base}?${query}`}>{children}</Link>;
}
