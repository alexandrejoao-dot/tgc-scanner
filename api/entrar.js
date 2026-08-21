import { verificarPin, emitirToken } from '../lib/auth.js';

// POST -> verifica o PIN de acesso partilhado (app de uso pessoal, sem
// contas) e devolve um token de sessão de longa duração.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }

  const { pin } = req.body || {};
  if (!pin) {
    res.status(400).json({ erro: 'Pedido inválido.' });
    return;
  }

  if (!verificarPin(pin)) {
    res.status(401).json({ erro: 'PIN incorreto.' });
    return;
  }

  res.status(200).json({ token: emitirToken() });
}
