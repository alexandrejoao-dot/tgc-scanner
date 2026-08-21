-- Migração: acrescenta a lista "future" às listas possíveis (colecao/venda
-- já existiam). Corre isto no editor SQL do Supabase.

do $$
declare
  con text;
begin
  select conname into con
  from pg_constraint
  where conrelid = 'colecao'::regclass
    and pg_get_constraintdef(oid) like '%lista%';
  if con is not null then
    execute format('alter table colecao drop constraint %I', con);
  end if;
end $$;

alter table colecao add constraint colecao_lista_check
  check (lista in ('colecao', 'venda', 'future'));
