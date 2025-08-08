// /public/js/supabase-init.js
(function () {
  if (window.supabaseClient && window.supabaseClient.auth) return;
  if (!(window.supabase && typeof window.supabase.createClient === 'function')) return;

  // Prefer lexical globals if available
  let url = null;
  let anon = null;
  try { if (typeof SUPABASE_URL !== 'undefined') url = SUPABASE_URL; } catch (_) {}
  try { if (typeof SUPABASE_ANON_KEY !== 'undefined') anon = SUPABASE_ANON_KEY; } catch (_) {}

  // Fallback to window vars or defaults
  url = url || window.SUPABASE_URL || window.SUPABASE_PROJECT_URL || 'https://gdcjvqaqgvcxzufmessy.supabase.co';
  anon = anon || window.SUPABASE_ANON_KEY || window.SUPABASE_PUBLIC_ANON_KEY || 'YOUR_PUBLIC_ANON_KEY';

  try {
    window.supabaseClient = window.supabase.createClient(url, anon);
  } catch (_) {
    // noop
  }
})();
