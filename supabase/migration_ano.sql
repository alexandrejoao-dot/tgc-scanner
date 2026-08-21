-- Migração: guarda o ano de lançamento de cada carta na coleção, para
-- permitir ordenar por ano. Corre isto no editor SQL do Supabase.

alter table colecao add column if not exists ano smallint;
