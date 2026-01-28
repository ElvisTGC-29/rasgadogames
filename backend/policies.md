# Políticas RLS (resumo)

## Regras base
- Leitura do fórum: somente usuário autenticado.
- Escrita (criar tópico/post): somente autenticado.
- Editar/ocultar: autor do conteúdo OU admin.
- Admin: `profiles.is_admin = true`.

## Dica
Ative RLS em todas as tabelas e crie policies para:
- SELECT: auth.uid() is not null
- INSERT: auth.uid() = author_id
- UPDATE: auth.uid() = author_id OR is_admin
- DELETE: somente admin (ou autor + janela de tempo, se quiser)

Quando formos implementar, eu escrevo o script completo de policies sem risco.
