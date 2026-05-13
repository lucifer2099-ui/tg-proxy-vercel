export const config = {
  runtime: 'edge', // 指定使用 Edge Runtime 以获得最佳性能
};

const TELEGRAM_API_DOMAIN = 'api.telegram.org';

export default async function handler(request) {
  const url = new URL(request.url);

  // 处理预检请求 (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Max-Age': '86400',
      }
    });
  }

  // 构造新的请求地址
  const targetUrl = `https://${TELEGRAM_API_DOMAIN}${url.pathname}${url.search}`;

  // 复制并修改请求头
  const newHeaders = new Headers(request.headers);
  newHeaders.set('Host', TELEGRAM_API_DOMAIN);

  try {
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      redirect: 'follow'
    });

    const response = await fetch(modifiedRequest);

    // 构造响应并添加 CORS 支持
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error_code: 500,
      description: "Vercel Proxy Error: " + err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}