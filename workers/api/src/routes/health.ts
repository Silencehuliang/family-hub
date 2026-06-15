/**
 * 健康检查路由
 */
import { Hono } from 'hono';
import type { Env, HonoVars } from '../env';

export const healthRoutes = new Hono<{ Bindings: Env; Variables: HonoVars }>();

healthRoutes.get('/', (c) => c.json({ data: { status: 'ok', timestamp: Date.now() } }));
