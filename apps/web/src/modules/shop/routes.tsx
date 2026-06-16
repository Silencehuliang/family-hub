import type { RouteObject } from 'react-router-dom';
import { ShopListPage } from './ShopListPage';
import { ShopEditPage } from './ShopEditPage';
import { ShopListDetailPage } from './ShopListDetailPage';

export const shopRoutes: RouteObject[] = [
  { path: '/shop', element: <ShopListPage /> },
  { path: '/shop/new', element: <ShopEditPage /> },
  { path: '/shop/:listId', element: <ShopListDetailPage /> },
];
