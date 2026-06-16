/**
 * 全局中间件:将 pages.dev 域名 301 重定向到自定义域名
 */
export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
}): Promise<Response> {
  const url = new URL(context.request.url);

  if (url.hostname === 'famhub-598.pages.dev') {
    return Response.redirect(
      `https://silencehl.dpdns.org${url.pathname}${url.search}`,
      301,
    );
  }

  return context.next();
}
