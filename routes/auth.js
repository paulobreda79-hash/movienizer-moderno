const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const user = await AuthService.register({ username, email, password });
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios' });
    }

    const result = await AuthService.login(username, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    await AuthService.logout(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { sessionId, currentPassword, newPassword } = req.body;
    
    const session = await AuthService.validateSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    await AuthService.changePassword(session.userId, currentPassword, newPassword);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/auth/update-profile
router.post('/update-profile', async (req, res) => {
  try {
    const { sessionId, ...profileData } = req.body;
    
    const session = await AuthService.validateSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    await AuthService.updateProfile(session.userId, profileData);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const sessionId = req.headers['authorization'] || req.query.sessionId;
    const session = await AuthService.validateSession(sessionId);
    
    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    res.json({ user: session });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;