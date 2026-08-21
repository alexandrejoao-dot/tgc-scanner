const BASE = 'https://api.pokemontcg.io/v2';

function cabecalhos() {
  const headers = { Accept: 'application/json' };
  if (process.env.POKEMONTCG_API_KEY) headers['X-Api-Key'] = process.env.POKEMONTCG_API_KEY;
  return headers;
}

// A pokemontcg.io sem chave de API é instável (erros 500/502 intermitentes,
// mesmo em pedidos válidos) — tenta outra vez antes de desistir.
async function fetchComRetentativas(url, tentativas = 3) {
  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      const resp = await fetch(url, { headers: cabecalhos() });
      if (resp.ok || resp.status < 500) return resp; // sucesso, ou erro do cliente (não vale a pena repetir)
      ultimoErro = new Error(`pokemontcg.io respondeu ${resp.status}`);
    } catch (err) {
      ultimoErro = err; // falha de rede — também vale a pena repetir
    }
    if (i < tentativas - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  throw ultimoErro;
}

// Normaliza uma carta da pokemontcg.io para a forma comum usada pelo frontend,
// independentemente do jogo de origem.
function normalizar(carta) {
  const cm = carta.cardmarket?.prices;
  const trend = cm?.trendPrice ?? null;
  const avg7 = cm?.avg7 ?? null;
  const variacao_pct = trend != null && avg7 ? ((trend - avg7) / avg7) * 100 : null;
  const preco_eur = trend ?? cm?.averageSellPrice ?? null;

  return {
    jogo: 'pokemon',
    id: carta.id,
    nome: carta.name,
    set_nome: carta.set?.name ?? '',
    numero: carta.number ?? '',
    raridade: carta.rarity ?? '',
    ano: carta.set?.releaseDate ? Number(carta.set.releaseDate.slice(0, 4)) : null,
    commander: null, // conceito exclusivo de Magic
    imagem: carta.images?.large || carta.images?.small || '',
    imagem_pequena: carta.images?.small || carta.images?.large || '',
    preco_eur,
    preco_foil_eur: null, // conceito exclusivo de Magic
    preco_baixo_eur: cm?.lowPrice ?? null,
    preco_alto_eur: null,
    preco_usd: carta.tcgplayer?.prices
      ? Object.values(carta.tcgplayer.prices)[0]?.market ?? null
      : null,
    variacao_pct,
    // Médias de preço da Cardmarket em três janelas — é o único histórico que
    // esta fonte expõe (não há série diária nem dados a 3 meses).
    historico: (cm?.avg1 != null || cm?.avg7 != null || cm?.avg30 != null)
      ? { d1: cm?.avg1 ?? null, d7: cm?.avg7 ?? null, d30: cm?.avg30 ?? null }
      : null,
  };
}

export async function pesquisarPokemon(query, setId) {
  let q = `name:"${query}*"`;
  if (setId) q += ` set.id:${setId}`;
  const url = `${BASE}/cards?q=${encodeURIComponent(q)}&pageSize=20&orderBy=-set.releaseDate`;
  const resp = await fetchComRetentativas(url);
  if (!resp.ok) throw new Error(`pokemontcg.io respondeu ${resp.status}`);
  const dados = await resp.json();
  return (dados.data || []).map(normalizar);
}

export async function obterCartaPokemon(id) {
  const resp = await fetchComRetentativas(`${BASE}/cards/${encodeURIComponent(id)}`);
  if (!resp.ok) throw new Error(`pokemontcg.io respondeu ${resp.status}`);
  const dados = await resp.json();
  return normalizar(dados.data);
}

// Lista de expansões, para o filtro de pesquisa — muda raramente, por isso
// fica em cache na instância da função enquanto ela estiver "quente".
let cacheSetsPokemon = null;
export async function listarSetsPokemon() {
  if (cacheSetsPokemon) return cacheSetsPokemon;
  const resp = await fetchComRetentativas(`${BASE}/sets?orderBy=-releaseDate`);
  if (!resp.ok) throw new Error(`pokemontcg.io respondeu ${resp.status}`);
  const dados = await resp.json();
  cacheSetsPokemon = (dados.data || []).map((s) => ({
    id: s.id,
    nome: s.name,
    ano: s.releaseDate ? Number(s.releaseDate.slice(0, 4)) : null,
  }));
  return cacheSetsPokemon;
}
