-- Migração: separa a coleção em duas listas independentes — "colecao"
-- (cartas que ficam) e "venda" (cartas para vender). Corre isto no editor
-- SQL do Supabase.

alter table colecao add column if not exists lista text not null default 'colecao'
  check (lista in ('colecao', 'venda'));

create index if not exists idx_colecao_lista on colecao(lista);
