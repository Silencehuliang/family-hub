import { Hono } from 'hono';
import {
  createShopListSchema, createShopItemSchema,
  updateShopItemSchema, buyShopItemSchema, shopToBillSchema,
} from '@family-hub/shared';
import { ok } from '../utils/response';
import { createShopService } from '../utils/serviceFactory';
import type { Env, HonoVars } from '../env';

export const shopRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

shopRoutes.get('/list', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createShopService(c.env.DB);
  const lists = await svc.listLists(familyId);
  return ok(c, lists);
});

shopRoutes.post('/list', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = createShopListSchema.parse(body);
  const svc = createShopService(c.env.DB);
  const list = await svc.createList(familyId, memberId, input);
  return c.json({ data: list }, 201);
});

shopRoutes.get('/list/:listId/item', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createShopService(c.env.DB);
  const bought = c.req.query('bought');
  const items = await svc.listItems(c.req.param('listId'), familyId, bought);
  return ok(c, items);
});

shopRoutes.post('/list/:listId/item', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = createShopItemSchema.parse(body);
  const svc = createShopService(c.env.DB);
  const item = await svc.addItem(c.req.param('listId'), familyId, input);
  return c.json({ data: item }, 201);
});

shopRoutes.put('/list/:listId/item/:itemId', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = updateShopItemSchema.parse(body);
  const svc = createShopService(c.env.DB);
  const item = await svc.updateItem(c.req.param('itemId'), c.req.param('listId'), familyId, input);
  return ok(c, item);
});

shopRoutes.delete('/list/:listId/item/:itemId', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createShopService(c.env.DB);
  await svc.deleteItem(c.req.param('itemId'), c.req.param('listId'), familyId);
  return ok(c, { success: true });
});

shopRoutes.post('/list/:listId/item/:itemId/buy', async (c) => {
  const { familyId } = c.var.auth;
  const body = await c.req.json();
  const input = buyShopItemSchema.parse(body);
  const svc = createShopService(c.env.DB);
  const item = await svc.buyItem(c.req.param('itemId'), c.req.param('listId'), familyId, input);
  return ok(c, item);
});

shopRoutes.post('/list/:listId/to-bill', async (c) => {
  const { familyId, memberId } = c.var.auth;
  const body = await c.req.json();
  const input = shopToBillSchema.parse(body);
  const svc = createShopService(c.env.DB);
  const bill = await svc.listToBill(c.req.param('listId'), familyId, memberId, input);
  return c.json({ data: bill }, 201);
});

shopRoutes.delete('/list/:listId', async (c) => {
  const { familyId } = c.var.auth;
  const svc = createShopService(c.env.DB);
  await svc.deleteList(c.req.param('listId'), familyId);
  return ok(c, { success: true });
});
