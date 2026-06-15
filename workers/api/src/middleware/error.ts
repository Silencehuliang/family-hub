/**
 * 统一错误处理中间件
 */
import type { MiddlewareHandler } from 'hono';
import { errorResponse } from '../utils/response';

export const errorMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next();
  } catch (err) {
    return errorResponse(c, err);
  }
};
