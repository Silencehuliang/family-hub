import type { Env } from './env';

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    console.log('[cron] scheduled event triggered');

    try {
      const { RecurringService } = await import('./modules/bill/RecurringService');
      const svc = new RecurringService(env.DB);
      const generated = await svc.tick();
      if (generated > 0) console.log(`[cron] generated ${generated} recurring bills`);
    } catch (err) {
      console.error('[cron] recurring tick error:', err);
    }
  },
};
