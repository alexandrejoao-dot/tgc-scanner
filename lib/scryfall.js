const BASE = 'https://api.scryfall.com';

// Scryfall pede um User-Agent identificável e um Accept explícito
// (boa cidadania da API — https://scryfall.com/docs/api).
const HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'TCG-Scanner/1.0 (projeto pessoal)',
};

// Normaliza uma carta do Scryfall para a mesma forma usada para o Pokémon.
// O Scryfall só devolve o preço atual, sem histórico — por isso não há
// variação nativa aqui (fica a null; a variação de itens guardados na
// coleção é calculada por nós a partir do preço anterior gravado).
function normalizar(carta) {
  const imagens = carta.image_uris || carta.card_faces?.[0]?.image_uris || {};
  const preco_eur = carta.prices?.eur != null ? Number(carta.prices.eur) : null;
  const preco_foil_eur = carta.prices?.eur_foil != null ? Number(carta.prices.eur_foil) : null;
  const tipoLinha = carta.type_line ?? '';
  const textoOraculo = carta.oracle_text ?? carta.card_faces?.[0]?.oracle_text ?? '';

  // Elegibilidade para Commander: legendária + criatura (regra geral), ou
  // qualquer carta cujo texto diga explicitamente "can be your commander"
  // (planeswalkers e algumas exceções). Dado real, derivado do type_line —
  // não é uma aproximação.
  const commander =
    (tipoLinha.includes('Legendary') && tipoLinha.includes('Creature')) ||
    /can be your commander/i.test(textoOraculo);

  return {
    jogo: 'magic',
    id: carta.id,
    nome: carta.name,
    set_nome: carta.set_name ?? '',
    numero: carta.collector_number ?? '',
    raridade: carta.rarity ? carta.rarity.charAt(0).toUpperCase() + carta.rarity.slice(1) : '',
    ano: carta.released_at ? Number(carta.released_at.slice(0, 4)) : null,
    commander,
    imagem: imagens.large || imagens.normal || imagens.small || '',
    imagem_pequena: imagens.small || imagens.normal || '',
    preco_eur,
    preco_foil_eur,
    preco_baixo_eur: null,
    preco_alto_eur: null,
    preco_usd: carta.prices?.usd != null ? Number(carta.prices.usd) : null,
    variacao_pct: null,
    historico: null, // Scryfall não expõe nenhum histórico de preço
  };
}

export async function pesquisarMagic(query) {
  const url = `${BASE}/cards/search?q=${encodeURIComponent(`name:${query}`)}&unique=prints&order=released&dir=desc`;
  const resp = await fetch(url, { headers: HEADERS });
  if (resp.status === 404) return []; // Scryfall devolve 404 quando não há resultados
  if (!resp.ok) throw new Error(`Scryfall respondeu ${resp.status}`);
  const dados = await resp.json();
  return (dados.data || []).slice(0, 20).map(normalizar);
}

export async function obterCartaMagic(id) {
  const resp = await fetch(`${BASE}/cards/${encodeURIComponent(id)}`, { headers: HEADERS });
  if (!resp.ok) throw new Error(`Scryfall respondeu ${resp.status}`);
  const carta = await resp.json();
  return normalizar(carta);
}
