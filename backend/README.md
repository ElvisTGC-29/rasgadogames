# Backend do Rasgado Games (plano)

Este site está hospedado como **frontend estático** (ex.: GitHub Pages). Para ter conta real, fórum, comentários e moderação,
você precisa de um backend externo.

## Opção recomendada (rápida e profissional): Supabase (Postgres + Auth + Storage)
Por quê:
- Banco Postgres (dá controle e escala).
- Auth pronto (email/senha, confirmação por email).
- Storage (upload de imagens/avatares).
- Row Level Security (RLS) para travar acesso e evitar bagunça.
- Dá para controlar tudo pelo painel e também criar uma página de Admin no próprio site.

### Arquitetura
- **Frontend**: GitHub Pages (este repositório).
- **Backend**: Supabase (projeto separado).
- **Anti-spam**: Cloudflare Turnstile (opcional, recomendado quando abrir o fórum).

### O que vira “real”
- Login/Cadastro: deixa de ser localStorage e passa a ser Auth do Supabase.
- Fórum: categorias, tópicos, posts, likes, reports.
- Comentários: comentários em páginas de guias/detonados.
- Moderação: ocultar post, bloquear usuário, fixar tópico.

## Próximos passos (checklist)
1) Criar projeto no Supabase
2) Rodar `schema.sql` no SQL Editor
3) Ativar RLS e aplicar políticas sugeridas
4) Criar 1 usuário admin e marcar como admin (tabela `profiles`)
5) Trocar o login do site para usar Supabase (fetch ou supabase-js)
6) Fazer o fórum ler/escrever no banco
7) Criar mini-painel Admin (somente admin)

Veja: `schema.sql`
