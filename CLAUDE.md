# CLAUDE.md

Contexto para o Claude Code (e outros LLMs) que trabalharem neste repositório.

## O que é este projeto

**TCG Scanner** é uma app pessoal (v1, sem contas) para pesquisar cartas de **Pokémon** e **Magic: The Gathering** e guardar uma coleção com o valor acompanhado em euros (preços da Cardmarket).

Nasceu a partir de 4 mockups gerados no Stitch (`~/Projects/TGC/stitch_tcg_price_scanner/`) com um tema visual "Cyber-Scanner" (glassmorphism, tema escuro, acentos neon roxo/verde/azul). O ecrã de "scan por câmara" do mock original foi substituído por pesquisa manual de texto — reconhecimento de imagem está fora de âmbito da v1.

## Decisões que não se tocam sem confirmar com o utilizador

- **A API oficial da Cardmarket está fechada a novos pedidos.** Os preços vêm de duas fontes gratuitas que já os expõem em EUR (derivados da Cardmarket): **pokemontcg.io** (`lib/pokemontcg.js`, campo `cardmarket.prices`) e **Scryfall** (`lib/scryfall.js`, campo `prices.eur`). Antes de trocar de fonte, confirma com o utilizador.
- **Só Pokémon e Magic estão ativos.** Yu-Gi-Oh! aparece em Definições como "brevemente" — não ligar sem antes decidir de onde viriam os preços (não há fonte gratuita e fiável identificada ainda).
- **Uso pessoal, um único PIN de acesso partilhado** (`ACCESS_PIN` no ambiente, comparado diretamente em `lib/auth.js` — não é um PIN por utilizador nem está guardado em BD). Não introduzir contas/multi-utilizador sem alinhar primeiro — é uma mudança de arquitetura, não um ajuste pequeno.
- **O visual "Cyber-Scanner"** (paleta escura, `glass-panel`, tipografia Hanken Grotesk/Inter/JetBrains Mono) foi extraído fielmente dos mocks originais — não alterar sem pedido explícito.

## Arquitetura

```
public/                frontend estático (servido pela Vercel a partir daqui)
  index.html             casca da app: cabeçalho, #ecra (conteúdo dinâmico), nav inferior
  css/style.css          classes custom extraídas dos mocks (glass-panel, scan-line, toggle switch...)
  js/sessao.js           PIN de acesso, sessão em localStorage, helper pedidoAPI()
  js/app.js              os 4 ecrãs: pesquisar, detalhe da carta, coleção, definições

api/                   funções serverless (Node, Vercel Functions)
  entrar.js               POST verifica o ACCESS_PIN, emite token de sessão (JWT, 30 dias)
  pesquisar.js             GET ?jogo=pokemon|magic&q=... -> roteia para pokemontcg.io ou Scryfall
  carta.js                 GET ?jogo=...&id=... -> detalhe de uma carta
  colecao.js                GET/POST/DELETE -> coleção pessoal no Supabase; o GET atualiza os
                            preços em direto (best-effort) e desloca preco_atual->preco_anterior

lib/                   código partilhado
  supabase.js             cliente Supabase (service role — nunca exposto ao cliente)
  auth.js                 emitir/verificar token de sessão a partir do ACCESS_PIN
  pokemontcg.js            wrapper para api.pokemontcg.io/v2 — normaliza para a forma comum
  scryfall.js              wrapper para api.scryfall.com — normaliza para a mesma forma

supabase/schema.sql    tabela colecao (jogo, provider_id, nome, set, número, preços em EUR)
```

Ambas as fontes de preço são normalizadas para a mesma forma (`{jogo, id, nome, set_nome, numero, raridade, imagem, preco_eur, preco_baixo_eur, preco_usd, variacao_pct}`) antes de chegarem ao frontend — o `js/app.js` não sabe (nem precisa saber) de onde veio cada carta.

## Configuração e desenvolvimento local

Ver o README para o passo a passo. Variáveis de ambiente em `.env.example`.

```bash
npm install
npx vercel dev   # corre o frontend estático + as funções serverless localmente
```
