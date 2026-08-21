import { exigirSessao } from '../lib/auth.js';
import { listarSetsPokemon } from '../lib/pokemontcg.js';
import { listarSetsMagic } from '../lib/scryfall.js';

// GET ?jogo=pokemon|magic -> lista de expansões, para o filtro de pesquisa.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }
  if (!exigirSessao(req, res)) return;

  const { jogo } = req.query || {};
  try {
    const sets = jogo === 'magic' ? await listarSetsMagic() : await listarSetsPokemon();
    res.status(200).json({ sets });
  } catch (err) {
    console.error('Erro ao obter expansões:', err);
    res.status(502).json({ erro: 'Não foi possível carregar as expansões agora.' });
  }
}
