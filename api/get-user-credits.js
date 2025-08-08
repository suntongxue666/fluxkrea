// /api/get-user-credits.js

// 强制把可选依赖打进 Serverless 包，避免 IMPORT_FAIL
try { require('@supabase/node-fetch'); } catch (_) {}
try { require('whatwg-url'); } catch (_) {}

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader.split(';').map(v => v.trim()).filter(Boolean).map(v => {
      const idx = v.indexOf('=');
      return [decodeURIComponent(v.slice(0, idx)), decodeURIComponent(v.slice(idx + 1))];
    })
  );
}

function extractAccessToken(req) {
  const auth = req.headers?.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const cookies = parseCookies(req.headers?.cookie || '');
  if (cookies['sb-access-token']) return cookies['sb-access-token'];
  if (cookies['supabase-auth-token']) {
    try {
      const parsed = JSON.parse(cookies['supabase-auth-token']);
      const t = parsed?.currentSession?.access_token || parsed?.access_token;
      if (t) return t;
    } catch (_) {}
  }
  return null;
}

async function trySelectFirst(supabase, table, selectors, filters) {
  try {
    const sel = selectors.join(', ');
    let q = supabase.from(table).select(sel);
    for (const [col, val] of filters) q = q.eq(col, val);
    const { data, error } = await q.maybeSingle();
    if (error) return null;
    return data || null;
  } catch (_) {
    return null;
  }
}

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1) 环境自检（缺就直接返回 JSON）
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env || {};
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ success: false, error: 'Environment configuration missing', code: 'ENV_MISSING' });
  }

  // 2) 健康检查：在浏览器访问 ?debug=1 确认函数能跑
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.searchParams.get('debug') === '1') {
      return res.status(200).json({ success: true, message: 'API is healthy', node: process.versions.node });
    }
  } catch (_) {}

  // 3) 取 token（没有就返回匿名用户状态）
  const token = extractAccessToken(req);
  if (!token) {
    return res.status(200).json({ 
      success: true, 
      credits: 0, 
      user_type: 'anonymous',
      message: 'No authentication token provided'
    });
  }

  // —— 用 REST API，不再导入 supabase-js ——

  // 4) 基础 headers
  const base = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${token}`, Accept: 'application/json' };

  async function fetchJson(url) {
    const r = await fetch(url, { headers });
    if (!r.ok) return null;
    try { return await r.json(); } catch { return null; }
  }
  async function firstRow(url) {
    const data = await fetchJson(url);
    return Array.isArray(data) && data.length ? data[0] : null;
  }
  function enc(v) { return encodeURIComponent(v ?? ''); }

  // 5) 验证用户（Auth API）
  const uRes = await fetch(`${base}/auth/v1/user`, { headers });
  if (!uRes.ok) {
    return res.status(200).json({ 
      success: true, 
      credits: 0, 
      user_type: 'unauthenticated',
      message: 'Invalid or expired token'
    });
  }
  const user = await uRes.json();

  // 6) 兼容式积分查询（按多表多列尝试）
  let credits = 0;

  const tries = [
    () => firstRow(`${base}/rest/v1/users?select=credits,balance&id=eq.${enc(user.id)}&limit=1`),
    () => firstRow(`${base}/rest/v1/users?select=credits,balance&email=eq.${enc(user.email)}&limit=1`),
    () => firstRow(`${base}/rest/v1/users?select=credits,balance&uuid=eq.${enc(user.id)}&limit=1`),
    () => firstRow(`${base}/rest/v1/profiles?select=credits,balance&id=eq.${enc(user.id)}&limit=1`),
    () => firstRow(`${base}/rest/v1/profiles?select=credits,balance&email=eq.${enc(user.email)}&limit=1`),
    () => firstRow(`${base}/rest/v1/user_credits?select=balance&user_id=eq.${enc(user.id)}&limit=1`),
  ];

  for (const fn of tries) {
    const row = await fn();
    if (row && (row.credits != null || row.balance != null)) {
      credits = Number(row.credits ?? row.balance ?? 0) || 0;
      break;
    }
  }

  // 7) 返回标准格式（兼容前端期望的格式）
  return res.status(200).json({ 
    success: true, 
    credits: credits,
    user_type: 'registered',
    user_info: { 
      id: user.id, 
      email: user.email || null 
    }
  });
};

// 运行时：Node 22
module.exports.config = { runtime: 'nodejs22.x' };