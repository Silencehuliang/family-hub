import type { RouteObject } from 'react-router-dom';
import { TodoListPage } from './TodoListPage';
import { TodoEditPage } from './TodoEditPage';
import { TodoDetailPage } from './TodoDetailPage';

export const todoRoutes: RouteObject[] = [
  { path: '/todo', element: <TodoListPage /> },
  { path: '/todo/new', element: <TodoEditPage /> },
  { path: '/todo/:id', element: <TodoDetailPage /> },
  { path: '/todo/:id/edit', element: <TodoEditPage /> },
];
