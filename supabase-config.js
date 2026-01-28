// supabase-config.js
// Este arquivo conecta o frontend ao Supabase (Auth + DB).
// A "anon key" é pública por design. NUNCA coloque a service_role key no site.

const SUPABASE_URL = "https://wfzhfccwomdxkeltbglw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmemhmY2N3b21keGtlbHRiZ2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjE4NTUsImV4cCI6MjA4NTEzNzg1NX0.kDNvshPR2mSbbVTZIHz2SR-B_nnfeWdZy6sJ0L3v7e4";

// Build stamp (ajuda a confirmar que o browser pegou a versão mais nova)
window.RG_BUILD = "v24-2026-01-28";

// Supabase client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Captcha (Attack Protection) — Turnstile
// Se você ativou "CAPTCHA" no Supabase (Auth -> Attack Protection),
// você precisa enviar o token no login/cadastro. Aqui fica o SITE KEY do Cloudflare.
// O SECRET fica apenas no Supabase (não coloque no frontend).
(() => {
  const TURNSTILE_SITEKEY = "0x4AAAAAACU696IdHGV8UAq5";
  const prev = window.rgCaptcha || {};
  window.rgCaptcha = {
    provider: "turnstile",
    ...prev,
    turnstileSiteKey: TURNSTILE_SITEKEY,
  };
  // Log discreto (facilita debug no DevTools)
  console.info("[RG] supabase-config carregado:", window.RG_BUILD, window.rgCaptcha);
})();
