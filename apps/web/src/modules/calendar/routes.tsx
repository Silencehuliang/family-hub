import type { RouteObject } from 'react-router-dom';
import { CalendarPage } from './CalendarPage';
import { EventEditPage } from './EventEditPage';
import { EventDetailPage } from './EventDetailPage';

export const calendarRoutes: RouteObject[] = [
  { path: '/calendar', element: <CalendarPage /> },
  { path: '/calendar/new', element: <EventEditPage /> },
  { path: '/calendar/:id', element: <EventDetailPage /> },
  { path: '/calendar/:id/edit', element: <EventEditPage /> },
];
