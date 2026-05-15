export const config = {
  runtime: 'edge', // 指定使用 Edge Runtime 以获得最佳性能
};

const TELEGRAM_API_DOMAIN = 'api.telegram.org';

export default async function handler(request) {
  const url = new URL(request.url);

  // 处理根路径，返回一个简单的状态页面
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(JSON.stringify({
      status: "running",
      message: "Telegram Bot API Proxy is active.",
      usage: "Set your API root to this domain.",
      author: "Antigravity"
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 忽略 favicon.ico
  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 204 });
  }

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
  let targetUrl = `https://${TELEGRAM_API_DOMAIN}${url.pathname}${url.search}`;
  let finalBody = request.body;

  // 特殊处理 getUpdates 方法以防止 Vercel 超时断连
  if (url.pathname.endsWith('/getUpdates')) {
    // 1. 处理 URL 中的 timeout 参数
    const searchParams = new URLSearchParams(url.search);
    if (searchParams.has('timeout')) {
      const t = parseInt(searchParams.get('timeout'));
      if (t > 20) {
        searchParams.set('timeout', '20');
        targetUrl = `https://${TELEGRAM_API_DOMAIN}${url.pathname}?${searchParams.toString()}`;
      }
    }

    // 2. 处理 POST JSON Body 中的 timeout 参数
    if (request.method === 'POST' && request.headers.get('content-type')?.includes('application/json')) {
      try {
        const bodyText = await request.text();
        const bodyJson = JSON.parse(bodyText);
        if (bodyJson.timeout && bodyJson.timeout > 20) {
          bodyJson.timeout = 20;
          finalBody = JSON.stringify(bodyJson);
        } else {
          finalBody = bodyText; // 保持原样但已经消耗了 stream，所以传文本
        }
      } catch (e) {
        // 解析失败则不做处理，但因为已经 read 过了，需传回原文
      }
    }
  }

  // 复制并修改请求头
  const newHeaders = new Headers();
  const headersToSkip = [
    'host',
    'connection',
    'content-length',
    'cf-ray',
    'cf-visitor',
    'cf-connecting-ip',
    'x-forwarded-for',
    'x-real-ip',
    'x-vercel-id',
    'x-vercel-proxy-signature',
    'x-vercel-ip-city',
    'x-vercel-ip-country'
  ];

  for (const [key, value] of request.headers.entries()) {
    if (!headersToSkip.includes(key.toLowerCase())) {
      newHeaders.set(key, value);
    }
  }

  // 强制设置正确的 Host
  newHeaders.set('Host', TELEGRAM_API_DOMAIN);

  try {
    const isGetOrHead = ['GET', 'HEAD'].includes(request.method.toUpperCase());
    
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: isGetOrHead ? null : finalBody,
      redirect: 'follow'
    });

    const response = await fetch(modifiedRequest);

    // 构造响应并添加 CORS 支持
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    // 删除一些可能导致问题的响应头
    responseHeaders.delete('content-encoding'); 

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