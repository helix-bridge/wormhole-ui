import { RouteProps } from 'react-router-dom';
import { AirdropHistory } from '../pages/AirdropHistory';
import { HistoryRecords } from '../pages/CrossHistory';
import { Home } from '../pages/Home';

export enum Path {
  root = '/',
  history = '/history',
  airdrop = '/airdrop',
  airdropHistory = '/airdropHistory',
}

export const routes: RouteProps[] = [
  {
    exact: true,
    path: Path.root,
    component: Home,
  },
  {
    exact: true,
    path: Path.history,
    component: HistoryRecords,
  },
  {
    exact: true,
    path: Path.airdrop,
    component: Home,
  },
  {
    exact: true,
    path: Path.airdropHistory,
    children: AirdropHistory,
  },
  {
    exact: true,
    path: '/404',
    children: null,
  },
  {
    exact: true,
    path: '/noData',
    children: null,
  },
];
