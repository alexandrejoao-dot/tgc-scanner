import jwt from 'jsonwebtoken';

const SESSION_TTL = '30d';

function obterSegredo() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET não está configurado.');
  return secret;
}

// Verifica o PIN de acesso partilhado (uso pessoal, sem contas) e emite um
// token de sessão de longa duração.
export function verificarPin(pin) {
  const esperado = process.env.ACCESS_PIN;
  if (!esperado) throw new Error('ACCESS_PIN não está configurado.');
  return pin === esperado;
}

export function emitirToken() {
  return jwt.sign({}, obterSegredo(), { expiresIn: SESSION_TTL });
}

export function verificarSessao(req) {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return false;
  try {
    jwt.verify(token, obterSegredo());
    return true;
  } catch {
    return false;
  }
}

// Middleware simples: exige uma sessão válida, responde 401 se não houver.
export function exigirSessao(req, res) {
  if (!verificarSessao(req)) {
    res.status(401).json({ erro: 'Sessão inválida. Introduz o PIN novamente.' });
    return false;
  }
  return true;
}
