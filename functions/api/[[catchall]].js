export async function onRequest(context) {
  // 1. 获取 Service Binding (确保 Cloudflare 后台设置的变量名也是 API_SERVICE)
  const TARGET_WORKER = context.env.API_SERVICE;

  if (!TARGET_WORKER) {
    return new Response("Error: Service Binding 'API_SERVICE' not configured.", { status: 500 });
  }

  // 2. 获取原始请求 URL 对象
  const originalRequest = context.request;
  const url = new URL(originalRequest.url);

  // 3. 【核心修改】直接使用原始路径，不做任何替换
  // 前端请求: /api/items
  // Worker 收到: /api/items
  const newPath = url.pathname; 

  // 4. 构建转发请求
  // 注意：Service Binding 不需要真实的域名，这里使用 http://internal 只是为了满足 URL 格式要求
  // Worker 解析时主要看 pathname 和 search 参数
  const newUrl = `http://internal${newPath}${url.search}`;

  const newRequest = new Request(newUrl, {
    method: originalRequest.method,
    headers: originalRequest.headers,
    body: originalRequest.body,
    redirect: 'follow'
  });

  // 5. 发送给 Worker
  try {
    return await TARGET_WORKER.fetch(newRequest);
  } catch (e) {
    return new Response(`Proxy Error: ${e.message}`, { status: 500 });
  }
}
