// /public/js/supabase-init.js
(function () {
  if (window.supabaseClient && window.supabaseClient.auth) return;
  if (!(window.supabase && typeof window.supabase.createClient === 'function')) return;

  // Prefer lexical globals if available
  let url = null;
  let anon = null;
  try { if (typeof SUPABASE_URL !== 'undefined') url = SUPABASE_URL; } catch (_) {}
  try { if (typeof SUPABASE_ANON_KEY !== 'undefined') anon = SUPABASE_ANON_KEY; } catch (_) {}

  // Fallback to consistent project defaults so all pages share the same storage key
  url = url || 'https://gdcjvqaqgvcxzufmessy.supabase.co';
  anon = anon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkY2p2cWFxZ3ZjeHp1Zm1lc3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY2NTEsImV4cCI6MjA2OTc4MjY1MX0.wIblNpUZLgQcCJCVbKfae5n0jtcIshL9asVIit6iUBI';

  try {
    window.supabaseClient = window.supabase.createClient(url, anon);
  } catch (_) {
    // noop
  }
})();
