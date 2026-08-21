import { exigirSessao } from '../lib/auth.js';
import { pesquisarPokemon } from '../lib/pokemontcg.js';
import { pesquisarMagic } from '../lib/scryfall.js';

// GET ?jogo=pokemon|magic&q=... -> pesquisa cartas por nome, roteada para a
// fonte de preços correta. Esconde as chamadas diretas às APIs externas
// atrás de uma sessão válida (evita abuso do proxy).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }
  if (!exigirSessao(req, res)) return;

  const { jogo, q, set } = req.query || {};
  if (!q || String(q).trim().length < 2) {
    res.status(400).json({ erro: 'Escreve pelo menos 2 letras para pesquisar.' });
    return;
  }

  try {
    const resultados =
      jogo === 'magic' ? await pesquisarMagic(q, set) : await pesquisarPokemon(q, set);
    res.status(200).json({ resultados });
  } catch (err) {
    console.error('Erro na pesquisa:', err);
    res.status(502).json({ erro: 'Não foi possível pesquisar agora. Tenta outra vez.' });
  }
}
