const User = require('../models/User');
const Encryption = require('../utils/encryption');

class AuthService {
  static async register(userData) {
    // Verificar se usuário já existe
    const existingUser = await User.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Usuário já existe');
    }

    const existingEmail = await User.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('E-mail já está em uso');
    }

    // Criar novo usuário
    const newUser = await User.create(userData);
    return newUser;
  }

  static async login(username, password) {
    const user = await User.findByUsername(username);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Senha incorreta');
    }

    // Atualizar último login
    await User.updateLastLogin(user.id);

    // Gerar token de sessão
    const sessionId = Encryption.generateSessionId();
    
    // Armazenar sessão (pode ser em memória ou banco de dados)
    if (!global.activeSessions) {
      global.activeSessions = new Map();
    }
    global.activeSessions.set(sessionId, {
      userId: user.id,
      username: user.username,
      loginTime: new Date()
    });

    return {
      success: true,
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  }

  static async logout(sessionId) {
    if (global.activeSessions) {
      global.activeSessions.delete(sessionId);
    }
    return { success: true };
  }

  static async validateSession(sessionId) {
    if (!global.activeSessions) {
      return null;
    }
    
    const session = global.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Verificar se a sessão ainda é válida (ex: 24 horas)
    const now = new Date();
    const loginTime = new Date(session.loginTime);
    const diffHours = (now - loginTime) / (1000 * 60 * 60);
    
    if (diffHours > 24) { // Sessão expira após 24 horas
      global.activeSessions.delete(sessionId);
      return null;
    }

    return session;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isValidPassword = await User.verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    await User.updatePassword(userId, newPassword);
    return { success: true };
  }

  static async updateProfile(userId, profileData) {
    await User.updateProfile(userId, profileData);
    return { success: true };
  }
}

module.exports = AuthService;