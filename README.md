# TCG Scanner

App pessoal para pesquisar cartas de **Pokémon** e **Magic: The Gathering** e acompanhar o valor de uma coleção, com preços vindos da Cardmarket (via [pokemontcg.io](https://pokemontcg.io/) e [Scryfall](https://scryfall.com/docs/api)).

## Arquitetura

```
Browser  →  Vercel (estático + /api/*)  →  pokemontcg.io / Scryfall (preços) + Supabase (coleção)
```

- **Frontend estático** (`public/`) — sem build, Tailwind via CDN, tema escuro "Cyber-Scanner".
- **Funções serverless** (`api/`) na Vercel — escondem chaves e adicionam uma camada de sessão.
- **Supabase** (Postgres) — guarda só a coleção pessoal de cartas.

## Configuração local

1. `npm install`
2. Copia `.env.example` para `.env` e preenche:
   - `ACCESS_PIN` — o PIN que vais usar para entrar na app.
   - `SESSION_SECRET` — string aleatória (`openssl rand -hex 32`).
   - `POKEMONTCG_API_KEY` — opcional, mas recomendada ([pokemontcg.io/api](https://pokemontcg.io/api)) para menos instabilidade.
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — do teu projeto Supabase (Project Settings → API).
3. Cria a base de dados: corre `supabase/schema.sql` no editor SQL do Supabase.
4. `npx vercel dev`

## Âmbito da v1

- Pesquisa manual por nome (sem reconhecimento de imagem/câmara).
- Só Pokémon e Magic (fontes de preço Cardmarket gratuitas confirmadas). Yu-Gi-Oh! fica para depois.
- Uso pessoal — um único PIN de acesso partilhado, sem contas.
