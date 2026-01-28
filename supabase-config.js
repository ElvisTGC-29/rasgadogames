// supabase-config.js
// Este arquivo conecta o frontend ao Supabase (Auth + DB).
// A "anon key" é pública por design. NUNCA coloque a service_role key no site.

const SUPABASE_URL = "https://wfzhfccwomdxkeltbglw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmemhmY2N3b21keGtlbHRiZ2x3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NjE4NTUsImV4cCI6MjA4NTEzNzg1NX0.kDNvshPR2mSbbVTZIHz2SR-B_nnfeWdZy6sJ0L3v7e4";

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Captcha (Attack Protection) — Turnstile
// Se você ativou "CAPTCHA" no Supabase (Auth -> Attack Protection),
// coloque aqui o site key do Cloudflare Turnstile (o SECRET fica só no Supabase).
// Exemplo: window.rgCaptcha = { provider: 'turnstile', turnstileSiteKey: '0x4AAAAAACU696IdHGV8UAq5' }
window.rgCaptcha = window.rgCaptcha || {
  provider: 'turnstile',
  turnstileSiteKey: '' // <-- COLE AQUI o seu site key do Turnstile
};

