-- Migração: guarda se a carta na coleção é a versão foil, para saber qual
-- preço (normal ou foil) manter atualizado. Corre isto no editor SQL do Supabase.

alter table colecao add column if not exists foil boolean not null default false;
