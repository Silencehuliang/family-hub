/**
 * PIN 限流(KV 实现)
 * 5 次 / 10 分钟窗口,超限锁定 30 分钟
 */
import { PIN_LIMIT } from '@family-hub/shared';

const FAIL_PREFIX = 'pinfail:';
const LOCK_PREFIX = 'pinlock:';

interface FailCounter {
  count: number;
  windowStart: number;
}

/** 记录一次 PIN 失败,返回剩余尝试次数(0 表示已锁定) */
export async function recordPinFail(kv: KVNamespace, memberId: string): Promise<number> {
  const key = `${FAIL_PREFIX}${memberId}`;
  const nowSec = Math.floor(Date.now() / 1000);

  const counter = await kv.get<FailCounter>(key, 'json');
  let count = 1;

  if (counter && nowSec - counter.windowStart < PIN_LIMIT.WINDOW_SECONDS) {
    count = counter.count + 1;
  }

  await kv.put(key, JSON.stringify({ count, windowStart: nowSec }), {
    expirationTtl: PIN_LIMIT.WINDOW_SECONDS,
  });

  if (count >= PIN_LIMIT.MAX_ATTEMPTS) {
    // 锁定
    await kv.put(`${LOCK_PREFIX}${memberId}`, '1', {
      expirationTtl: PIN_LIMIT.LOCK_SECONDS,
    });
    return 0;
  }

  return PIN_LIMIT.MAX_ATTEMPTS - count;
}

/** 清除失败计数(登录成功后调用) */
export async function clearPinFail(kv: KVNamespace, memberId: string): Promise<void> {
  await kv.delete(`${FAIL_PREFIX}${memberId}`);
  await kv.delete(`${LOCK_PREFIX}${memberId}`);
}

/** 检查是否被锁定 */
export async function isPinLocked(kv: KVNamespace, memberId: string): Promise<boolean> {
  const locked = await kv.get(`${LOCK_PREFIX}${memberId}`);
  return locked !== null;
}

/** 获取剩余尝试次数 */
export async function getRemainingAttempts(kv: KVNamespace, memberId: string): Promise<number> {
  const key = `${FAIL_PREFIX}${memberId}`;
  const counter = await kv.get<FailCounter>(key, 'json');
  if (!counter) return PIN_LIMIT.MAX_ATTEMPTS;

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec - counter.windowStart >= PIN_LIMIT.WINDOW_SECONDS) {
    return PIN_LIMIT.MAX_ATTEMPTS;
  }

  return Math.max(0, PIN_LIMIT.MAX_ATTEMPTS - counter.count);
}
