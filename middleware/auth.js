const AuthService = require('../services/authService');

const authenticate = async (req, res, next) => {
  const sessionId = req.headers['authorization'] || req.query.sessionId;

  if (!sessionId) {
    return res.status(401).json({ error: 'Sessão não fornecida' });
  }

  const session = await AuthService.validateSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }

  req.user = session;
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }
  next();
};

module.exports = { authenticate, requireAuth };