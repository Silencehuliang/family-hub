import { Hono } from 'hono';
import { createTodoSchema, updateTodoSchema, setTodoStatusSchema, createSubtaskSchema } from '@family-hub/shared';
import { ok } from '../utils/response';
import { createTodoService } from '../utils/serviceFactory';
import type { Env, HonoVars } from '../env';

export const todoRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

todoRoutes.get('/', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createTodoService(c.env.DB);
  const query = {
    status: c.req.query('status'),
    assigneeId: c.req.query('assigneeId'),
    priority: c.req.query('priority'),
    dueBefore: c.req.query('dueBefore') ? parseInt(c.req.query('dueBefore')!) : undefined,
  };
  const items = await svc.list(familyId, query);
  return ok(c, items);
});

todoRoutes.post('/', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = createTodoSchema.parse(body);
  const svc = createTodoService(c.env.DB);
  const item = await svc.create(familyId, memberId, input);
  return c.json({ data: item }, 201);
});

todoRoutes.get('/:id', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createTodoService(c.env.DB);
  const item = await svc.getById(c.req.param('id'), familyId);
  return ok(c, item);
});

todoRoutes.put('/:id', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = updateTodoSchema.parse(body);
  const svc = createTodoService(c.env.DB);
  const item = await svc.update(c.req.param('id'), familyId, memberId, input);
  return ok(c, item);
});

todoRoutes.delete('/:id', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createTodoService(c.env.DB);
  await svc.delete(c.req.param('id'), familyId);
  return ok(c, { success: true });
});

todoRoutes.post('/:id/status', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = setTodoStatusSchema.parse(body);
  const svc = createTodoService(c.env.DB);
  const item = await svc.setStatus(c.req.param('id'), familyId, memberId, input.status);
  return ok(c, item);
});

todoRoutes.post('/:id/subtask', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = createSubtaskSchema.parse(body);
  const svc = createTodoService(c.env.DB);
  const sub = await svc.addSubtask(c.req.param('id'), familyId, input);
  return c.json({ data: sub }, 201);
});

todoRoutes.put('/:id/subtask/:subId', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const svc = createTodoService(c.env.DB);
  const sub = await svc.updateSubtask(c.req.param('id'), c.req.param('subId'), familyId, body);
  return ok(c, sub);
});

todoRoutes.delete('/:id/subtask/:subId', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createTodoService(c.env.DB);
  await svc.deleteSubtask(c.req.param('id'), c.req.param('subId'), familyId);
  return ok(c, { success: true });
});
