import { exigirSessao } from '../lib/auth.js';
import { obterCartaPokemon } from '../lib/pokemontcg.js';
import { obterCartaMagic } from '../lib/scryfall.js';

// GET ?jogo=pokemon|magic&id=... -> detalhe de uma carta específica.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }
  if (!exigirSessao(req, res)) return;

  const { jogo, id } = req.query || {};
  if (!id) {
    res.status(400).json({ erro: 'Pedido inválido.' });
    return;
  }

  try {
    const carta = jogo === 'magic' ? await obterCartaMagic(id) : await obterCartaPokemon(id);
    res.status(200).json({ carta });
  } catch (err) {
    console.error('Erro ao obter carta:', err);
    res.status(502).json({ erro: 'Não foi possível carregar esta carta agora.' });
  }
}
