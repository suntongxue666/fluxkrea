// /api/get-user-credits.js

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
  // 1) 环境自检（缺就直接返回 JSON）
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env || {};
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ ok: false, code: 'ENV_MISSING', have: { url: !!SUPABASE_URL, key: !!SUPABASE_ANON_KEY } });
  }

  // 2) 健康检查：在浏览器访问 ?debug=1 确认函数能跑
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.searchParams.get('debug') === '1') {
      return res.status(200).json({ ok: true, code: 'HEALTH_OK', node: process.versions.node });
    }
  } catch (_) {}

  // 3) 取 token（没有就 401）
  const token = extractAccessToken(req);
  if (!token) return res.status(401).json({ ok: false, code: 'UNAUTHENTICATED' });

  // 4) 动态导入 ESM 版 supabase-js
  let createClient;
  try {
    ({ createClient } = await import('@supabase/supabase-js/dist/module/index.js'));
  } catch (e) {
    return res.status(500).json({ ok: false, code: 'IMPORT_FAIL', message: e?.message || 'import_failed' });
  }

  // 5) 初始化客户端
  let supabase;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    return res.status(500).json({ ok: false, code: 'CLIENT_INIT_FAIL', message: e?.message || 'client_init_failed' });
  }

  // 6) 获取用户（直接把 token 传给 SDK，避免 headers 方式带来的兼容问题）
  let userResp, userErr;
  try {
    ({ data: userResp, error: userErr } = await supabase.auth.getUser(token));
  } catch (e) {
    return res.status(500).json({ ok: false, code: 'GET_USER_THROW', message: e?.message || 'get_user_failed' });
  }
  if (userErr || !userResp?.user) return res.status(401).json({ ok: false, code: 'INVALID_TOKEN' });

  const user = userResp.user;

  // 7) 兼容式积分查询（查不到就 0）
  let credits = 0;
  const candidates = [
    () => trySelectFirst(supabase, 'users', ['credits', 'balance'], [['id', user.id]]),
    () => trySelectFirst(supabase, 'users', ['credits', 'balance'], [['email', user.email || '']]),
    () => trySelectFirst(supabase, 'users', ['credits', 'balance'], [['uuid', user.id]]),
    () => trySelectFirst(supabase, 'profiles', ['credits', 'balance'], [['id', user.id]]),
    () => trySelectFirst(supabase, 'profiles', ['credits', 'balance'], [['email', user.email || '']]),
    () => trySelectFirst(supabase, 'user_credits', ['balance'], [['user_id', user.id]])
  ];
  for (const get of candidates) {
    const row = await get();
    if (row && (row.credits != null || row.balance != null)) {
      credits = Number(row.credits ?? row.balance ?? 0) || 0;
      break;
    }
  }

  return res.status(200).json({ ok: true, user: { id: user.id, email: user.email || null }, credits });
};

// 运行时：Node 22
module.exports.config = { runtime: 'nodejs22.x' };