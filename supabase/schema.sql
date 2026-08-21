-- Esquema da base de dados do TCG Scanner
-- Corre isto no editor SQL do teu projeto Supabase.

create extension if not exists "pgcrypto";

-- Coleção pessoal de cartas (app de uso pessoal, sem contas de utilizador).
create table if not exists colecao (
  id uuid primary key default gen_random_uuid(),
  jogo text not null check (jogo in ('pokemon', 'magic')),
  provider_id text not null,        -- id da carta na fonte de origem (pokemontcg.io ou Scryfall)
  nome text not null,
  set_nome text not null default '',
  numero text not null default '',
  raridade text not null default '',
  ano smallint,
  foil boolean not null default false,
  lista text not null default 'colecao' check (lista in ('colecao', 'venda', 'future')),
  imagem text not null default '',
  preco_atual_eur numeric,
  preco_anterior_eur numeric,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_colecao_jogo on colecao(jogo);
create index if not exists idx_colecao_lista on colecao(lista);

-- Row Level Security: ativa e não cria políticas. Só o service role (usado
-- pelas funções serverless em api/) consegue aceder — o cliente (browser)
-- nunca fala diretamente com o Supabase.
alter table colecao enable row level security;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
