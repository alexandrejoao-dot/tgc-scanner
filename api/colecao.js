import { exigirSessao } from '../lib/auth.js';
import { getSupabase } from '../lib/supabase.js';
import { obterCartaPokemon } from '../lib/pokemontcg.js';
import { obterCartaMagic } from '../lib/scryfall.js';

// Só atualiza o preço de uma carta em direto se a última atualização já tiver
// mais do que isto — evita repetir dezenas de pedidos às APIs externas (lentas
// e instáveis) sempre que a lista é aberta, quando os preços não mudam de
// minuto a minuto.
const IDADE_MAXIMA_MS = 6 * 60 * 60 * 1000; // 6 horas

// GET    -> lista a coleção; atualiza em direto os preços desatualizados
//           (best-effort, uma falha isolada não derruba a lista) e desloca
//           preco_atual -> preco_anterior para se poder mostrar a variação.
// POST   -> adiciona uma carta à coleção.
// DELETE -> remove uma carta da coleção.
export default async function handler(req, res) {
  if (!exigirSessao(req, res)) return;
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const lista = ['venda', 'future'].includes(req.query?.lista) ? req.query.lista : 'colecao';
    const { data, error } = await supabase
      .from('colecao')
      .select('*')
      .eq('lista', lista)
      .order('criado_em', { ascending: false });
    if (error) {
      res.status(500).json({ erro: 'Não foi possível carregar a coleção.' });
      return;
    }

    const atualizadas = await Promise.all(
      (data || []).map(async (item) => {
        const idade = Date.now() - new Date(item.atualizado_em).getTime();
        if (idade < IDADE_MAXIMA_MS) return item;
        try {
          const fresca =
            item.jogo === 'magic'
              ? await obterCartaMagic(item.provider_id)
              : await obterCartaPokemon(item.provider_id);
          const precoFresco = item.foil ? fresca.preco_foil_eur : fresca.preco_eur;
          if (precoFresco == null || precoFresco === item.preco_atual_eur) return item;

          const { data: atualizado } = await supabase
            .from('colecao')
            .update({
              preco_anterior_eur: item.preco_atual_eur,
              preco_atual_eur: precoFresco,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', item.id)
            .select()
            .single();
          return atualizado || item;
        } catch {
          return item; // fonte em baixo/instável — mantém o valor guardado
        }
      })
    );

    res.status(200).json({ colecao: atualizadas });
    return;
  }

  if (req.method === 'POST') {
    const { jogo, provider_id, nome, set_nome, numero, raridade, ano, foil, lista, imagem, preco_eur } = req.body || {};
    if (!jogo || !provider_id || !nome) {
      res.status(400).json({ erro: 'Pedido inválido.' });
      return;
    }

    const { data, error } = await supabase
      .from('colecao')
      .insert({
        jogo,
        provider_id,
        nome,
        set_nome: set_nome || '',
        numero: numero || '',
        raridade: raridade || '',
        ano: ano ?? null,
        foil: !!foil,
        lista: ['venda', 'future'].includes(lista) ? lista : 'colecao',
        imagem: imagem || '',
        preco_atual_eur: preco_eur ?? null,
        preco_anterior_eur: null,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ erro: 'Não foi possível adicionar à coleção.' });
      return;
    }
    res.status(201).json({ item: data });
    return;
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ erro: 'Pedido inválido.' });
      return;
    }
    const { error } = await supabase.from('colecao').delete().eq('id', id);
    if (error) {
      res.status(500).json({ erro: 'Não foi possível remover.' });
      return;
    }
    res.status(200).json({ removido: true });
    return;
  }

  res.status(405).json({ erro: 'Método não permitido' });
}
