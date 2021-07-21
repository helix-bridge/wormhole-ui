import { RouteProps } from 'react-router-dom';

export enum Path {
  root = '/',
  wallet = '/wallet',
  extrinsic = '/extrinsic',
}

export const routes: RouteProps[] = [
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
