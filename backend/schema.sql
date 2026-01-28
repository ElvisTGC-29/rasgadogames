-- Rasgado Games forum + comments (base)
-- Objetivo: tabelas simples, extensíveis, com RLS.

-- PERFIL (ligado ao auth.users do Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- CATEGORIAS (por jogo)
create table if not exists public.forum_categories (
  id bigserial primary key,
  game text not null check (game in ('stardew','haunted')),
  slug text not null,
  title text not null,
  description text,
  sort_order int not null default 0,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique(game, slug)
);

-- TÓPICOS
create table if not exists public.forum_topics (
  id bigserial primary key,
  game text not null check (game in ('stardew','haunted')),
  category_id bigint not null references public.forum_categories(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  slug text,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- POSTS (respostas)
create table if not exists public.forum_posts (
  id bigserial primary key,
  topic_id bigint not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  content_md text not null, -- markdown simples
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- REAÇÕES (curtida)
create table if not exists public.forum_reactions (
  id bigserial primary key,
  post_id bigint not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'like',
  created_at timestamptz not null default now(),
  unique(post_id, user_id, kind)
);

-- REPORTS (denúncias)
create table if not exists public.forum_reports (
  id bigserial primary key,
  post_id bigint not null references public.forum_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null
);

-- COMENTÁRIOS EM PÁGINAS (ex.: guias)
create table if not exists public.page_comments (
  id bigserial primary key,
  page_key text not null, -- ex: 'stardew:comecando' ou '/stardew/comecando.html'
  author_id uuid not null references public.profiles(id) on delete restrict,
  content_md text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists idx_topics_category on public.forum_topics(category_id, created_at desc);
create index if not exists idx_posts_topic on public.forum_posts(topic_id, created_at asc);
create index if not exists idx_comments_page on public.page_comments(page_key, created_at desc);

-- Observação:
-- As políticas RLS serão definidas no painel (recomendado) ou em script separado.
