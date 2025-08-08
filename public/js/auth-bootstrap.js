// /public/js/auth-bootstrap.js
(function () {
  function detectClient() {
    // Prefer an existing client
    if (window.supabaseClient && window.supabaseClient.auth) return window.supabaseClient;

    // If SDK is loaded and page exposes constants, create a client lazily
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      const url = window.SUPABASE_URL || window.SUPABASE_PROJECT_URL || null;
      const anon = window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLIC_ANON_KEY || null;
      if (url && anon) {
        try {
          window.supabaseClient = window.supabase.createClient(url, anon);
          return window.supabaseClient;
        } catch (_) {
          return null;
        }
      }
    }
    return null;
  }

  async function getSessionToken(client) {
    if (!client?.auth) return null;
    try {
      const { data: { session } } = await client.auth.getSession();
      return session?.access_token || null;
    } catch (_) {
      return null;
    }
  }

  async function fetchCredits(token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch('/api/get-user-credits', { headers, credentials: 'include' });
      const json = await res.json().catch(() => null);
      return json;
    } catch (_) {
      return null;
    }
  }

  function updateUI(info) {
    // Generic hooks (preferred)
    const signedInEl = document.querySelector('[data-auth="signed-in"]');
    const signedOutEl = document.querySelector('[data-auth="signed-out"]');
    const emailEl = document.querySelector('[data-auth-email]');
    const creditsEl = document.querySelector('[data-auth-credits]');

    // Fallback hooks used by current pages
    const creditsDisplayEl = document.getElementById('creditsDisplay');
    const creditsAmountEl = document.getElementById('creditsAmount');
    const signinBtnEl = document.querySelector('.signin-btn');

    const isLogged = info?.ok && info.user;

    // Preferred hooks
    if (signedInEl) signedInEl.style.display = isLogged ? '' : 'none';
    if (signedOutEl) signedOutEl.style.display = isLogged ? 'none' : '';
    if (emailEl) emailEl.textContent = isLogged ? (info.user.email || '') : '';
    if (creditsEl) creditsEl.textContent = isLogged ? (info.credits ?? 0) : 0;

    // Fallbacks for current markup
    if (creditsDisplayEl) creditsDisplayEl.style.display = 'flex';
    if (creditsAmountEl) creditsAmountEl.textContent = isLogged ? (info.credits ?? 0) : 0;

    if (signinBtnEl && isLogged && info.user?.email) {
      signinBtnEl.innerHTML = `
        <img src="https://via.placeholder.com/18" style="width: 18px; height: 18px; border-radius: 50%;" alt="Avatar">
        <span>${info.user.email.split('@')[0]}</span>
      `;
    }
  }

  (async function init() {
    const client = detectClient();
    const token = await getSessionToken(client);
    const info = await fetchCredits(token);
    updateUI(info);
  })();
})();