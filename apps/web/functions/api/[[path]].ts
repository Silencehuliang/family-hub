import worker from '../../../../workers/api/src/index';

export async function onRequest(context: { request: Request; env: unknown; waitUntil: (p: Promise<unknown>) => void; passThroughOnException: () => void }) {
  return worker.fetch(context.request, context.env, {
    waitUntil: context.waitUntil.bind(context),
    passThroughOnException: context.passThroughOnException?.bind(context),
  });
}
