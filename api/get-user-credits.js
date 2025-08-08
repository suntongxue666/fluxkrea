// /api/get-user-credits.js
const { createClient } = require('@supabase/supabase-js');

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
  // 环境自检：缺配置直接返回 JSON，避免 500 HTML
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({ ok: false, code: 'ENV_MISSING' });
  }

  const token = extractAccessToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, code: 'UNAUTHENTICATED' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  try {
    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return res.status(401).json({ ok: false, code: 'INVALID_TOKEN' });
    }

    const user = userResp.user;
    let credits = 0;

    const candidates = [
      () => trySelectFirst(supabase, 'users', ['credits', 'balance'], [['id', user.id]]),
      () => trySelectFirst(supabase, 'users', ['credits', 'balance'], [['email', user.email || '']]),
      () => trySelectFirst(supabase, 'users', ['credits', 'balance'], [['uuid', user.id]]),
      () => trySelectFirst(supabase, 'profiles', ['credits', 'balance'], [['id', user.id]]),
      () => trySelectFirst(supabase, 'profiles', ['credits', 'balance'], [['email', user.email || '']]),
      () => trySelectFirst(supabase, 'user_credits', ['balance'], [['user_id', user.id]]),
    ];

    for (const get of candidates) {
      const row = await get();
      if (row && (row.credits != null || row.balance != null)) {
        credits = Number(row.credits ?? row.balance ?? 0) || 0;
        break;
      }
    }

    return res.status(200).json({ ok: true, user: { id: user.id, email: user.email || null }, credits });
  } catch (err) {
    return res.status(200).json({ ok: false, code: 'INTERNAL_ERROR', message: err?.message || 'unknown_error' });
  }
};

// 强制使用 Node 运行时（避免 Edge 环境崩溃）
module.exports.config = { runtime: 'nodejs22.x' };