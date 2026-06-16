import { Hono } from 'hono';
import { createEventSchema, updateEventSchema, calendarQuerySchema } from '@family-hub/shared';
import { ok } from '../utils/response';
import { createEventService } from '../utils/serviceFactory';
import type { Env, HonoVars } from '../env';

export const eventRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

eventRoutes.get('/calendar', async (c) => {
  const { familyId } = c.var.auth;
  const { month } = calendarQuerySchema.parse({ month: c.req.query('month') });
  const svc = createEventService(c.env.DB);
  const items = await svc.calendar(familyId, month);
  return ok(c, items);
});

eventRoutes.get('/:id', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createEventService(c.env.DB);
  const item = await svc.getById(c.req.param('id'), familyId);
  return ok(c, item);
});

eventRoutes.post('/', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = createEventSchema.parse(body);
  const svc = createEventService(c.env.DB);
  const item = await svc.create(familyId, memberId, input);
  return c.json({ data: item }, 201);
});

eventRoutes.put('/:id', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = updateEventSchema.parse(body);
  const svc = createEventService(c.env.DB);
  const item = await svc.update(c.req.param('id'), familyId, memberId, input);
  return ok(c, item);
});

eventRoutes.delete('/:id', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createEventService(c.env.DB);
  await svc.delete(c.req.param('id'), familyId);
  return ok(c, { success: true });
});
