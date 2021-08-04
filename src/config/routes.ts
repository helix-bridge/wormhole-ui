import { RouteProps } from 'react-router-dom';
import { Home } from '../pages/Home';
import { HistoryRecords } from '../pages/HistoryRecords';

export enum Path {
  root = '/',
  history = '/history',
}

export const routes: RouteProps[] = [
  {
    exact: true,
    path: Path.root,
    children: Home,
  },
  {
    exact: true,
    path: Path.history,
    component: HistoryRecords,
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
