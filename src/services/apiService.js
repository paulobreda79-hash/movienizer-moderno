// src/services/apiService.js

import axios from 'axios';
import appConfig from '../config/appConfig';

class ApiService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: appConfig.api.baseUrl,
      timeout: appConfig.api.timeout,
      headers: appConfig.api.headers
    });

    // Interceptors
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Requisição
    this.apiClient.interceptors.request.use(
      config => {
        // Adicionar token de autenticação
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Adicionar ID da requisição
        config.headers['X-Request-ID'] = Date.now().toString();
        
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Resposta
    this.apiClient.interceptors.response.use(
      response => {
        return response;
      },
      async error => {
        if (error.response?.status === 401) {
          // Token expirado - fazer logout
          await this.logout();
        }
        
        // Log de erro
        console.error('Erro na requisição:', error);
        
        // Retentar
        if (error.config && error.config.retry) {
          return this.retryRequest(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  getToken() {
    // Obter token do armazenamento local
    const token = localStorage.getItem('token');
    return token;
  }

  async logout() {
    // Limpar token e redirecionar
    localStorage.removeItem('token');
    // Redirecionar para tela de login
    // Você pode usar o navigation aqui
  }

  async retryRequest(config) {
    // Implementar lógica de retry
    const maxRetries = appConfig.api.retryAttempts;
    const delay = appConfig.api.retryDelay;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        const response = await this.apiClient(config);
        return response;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
  }

  // Métodos HTTP básicos
  async get(url, params = {}, config = {}) {
    try {
      const response = await this.apiClient.get(url, {
        params,
        ...config
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(url, data = {}, config = {}) {
    try {
      const response = await this.apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put(url, data = {}, config = {}) {
    try {
      const response = await this.apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    // Tratar erros de forma consistente
    if (error.response) {
      // Erro de resposta do servidor
      return {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data
      };
    } else if (error.request) {
      // Erro de rede
      return {
        status: 0,
        message: 'Erro de rede. Verifique sua conexão.',
        data: null
      };
    } else {
      // Outro tipo de erro
      return {
        status: -1,
        message: error.message,
        data: null
      };
    }
  }

  // Métodos específicos do MovieNizer
  async getMovies(params = {}) {
    return await this.get('/movies', params);
  }

  async getMovie(id) {
    return await this.get(`/movies/${id}`);
  }

  async createMovie(movie) {
    return await this.post('/movies', movie);
  }

  async updateMovie(id, movie) {
    return await this.put(`/movies/${id}`, movie);
  }

  async deleteMovie(id) {
    return await this.delete(`/movies/${id}`);
  }

  async getPeople(params = {}) {
    return await this.get('/people', params);
  }

  async getPerson(id) {
    return await this.get(`/people/${id}`);
  }

  async createPerson(person) {
    return await this.post('/people', person);
  }

  async updatePerson(id, person) {
    return await this.put(`/people/${id}`, person);
  }

  async deletePerson(id) {
    return await this.delete(`/people/${id}`);
  }

  async getRatings(params = {}) {
    return await this.get('/ratings', params);
  }

  async getRating(id) {
    return await this.get(`/ratings/${id}`);
  }

  async createRating(rating) {
    return await this.post('/ratings', rating);
  }

  async updateRating(id, rating) {
    return await this.put(`/ratings/${id}`, rating);
  }

  async deleteRating(id) {
    return await this.delete(`/ratings/${id}`);
  }

  async getWatchlist(params = {}) {
    return await this.get('/watchlist', params);
  }

  async addToWatchlist(movieId) {
    return await this.post('/watchlist', { movie_id: movieId });
  }

  async removeFromWatchlist(movieId) {
    return await this.delete(`/watchlist/${movieId}`);
  }

  async getFavorites(params = {}) {
    return await this.get('/favorites', params);
  }

  async addFavorite(movieId) {
    return await this.post('/favorites', { movie_id: movieId });
  }

  async removeFavorite(movieId) {
    return await this.delete(`/favorites/${movieId}`);
  }

  async getReminders(params = {}) {
    return await this.get('/reminders', params);
  }

  async createReminder(reminder) {
    return await this.post('/reminders', reminder);
  }

  async updateReminder(id, reminder) {
    return await this.put(`/reminders/${id}`, reminder);
  }

  async deleteReminder(id) {
    return await this.delete(`/reminders/${id}`);
  }

  async getNotifications(params = {}) {
    return await this.get('/notifications', params);
  }

  async markNotificationAsRead(id) {
    return await this.put(`/notifications/${id}/read`);
  }

  async deleteNotification(id) {
    return await this.delete(`/notifications/${id}`);
  }

  async getSettings() {
    return await this.get('/settings');
  }

  async updateSettings(settings) {
    return await this.put('/settings', settings);
  }

  async getStats() {
    return await this.get('/stats');
  }

  async getSearchResults(query) {
    return await this.get('/search', { q: query });
  }

  async getRecommendations() {
    return await this.get('/recommendations');
  }

  async getTrending() {
    return await this.get('/trending');
  }

  async getTopRated() {
    return await this.get('/top-rated');
  }

  async getNewReleases() {
    return await this.get('/new-releases');
  }

  async getUpcoming() {
    return await this.get('/upcoming');
  }

  async getGenres() {
    return await this.get('/genres');
  }

  async getStreamingServices() {
    return await this.get('/streaming-services');
  }

  async getTags() {
    return await this.get('/tags');
  }

  async createTag(tag) {
    return await this.post('/tags', tag);
  }

  async updateTag(id, tag) {
    return await this.put(`/tags/${id}`, tag);
  }

  async deleteTag(id) {
    return await this.delete(`/tags/${id}`);
  }

  async getVoiceCommands() {
    return await this.get('/voice-commands');
  }

  async createVoiceCommand(command) {
    return await this.post('/voice-commands', command);
  }

  async updateVoiceCommand(id, command) {
    return await this.put(`/voice-commands/${id}`, command);
  }

  async deleteVoiceCommand(id) {
    return await this.delete(`/voice-commands/${id}`);
  }

  async getBackup() {
    return await this.get('/backup');
  }

  async createBackup() {
    return await this.post('/backup');
  }

  async restoreBackup(backupId) {
    return await this.post(`/backup/${backupId}/restore`);
  }

  async exportData(format = 'json') {
    return await this.get('/export', { format });
  }

  async importData(data, format = 'json') {
    return await this.post('/import', { data, format });
  }

  async checkForUpdates() {
    return await this.get('/updates/check');
  }

  async downloadUpdate(updateId) {
    return await this.get(`/updates/${updateId}/download`);
  }

  async sendFeedback(feedback) {
    return await this.post('/feedback', feedback);
  }

  async rateApp() {
    return await this.post('/rate-app');
  }

  async contactSupport(message) {
    return await this.post('/contact', { message });
  }

  async authenticate(email, password) {
    return await this.post('/auth/login', { email, password });
  }

  async register(user) {
    return await this.post('/auth/register', user);
  }

  async forgotPassword(email) {
    return await this.post('/auth/forgot-password', { email });
  }

  async resetPassword(token, newPassword) {
    return await this.post('/auth/reset-password', { token, newPassword });
  }

  async verifyEmail(token) {
    return await this.post('/auth/verify-email', { token });
  }

  async resendVerification() {
    return await this.post('/auth/resend-verification');
  }

  async logoutUser() {
    return await this.post('/auth/logout');
  }

  async refreshAccessToken() {
    return await this.post('/auth/refresh-token');
  }

  async getProfile() {
    return await this.get('/profile');
  }

  async updateProfile(profile) {
    return await this.put('/profile', profile);
  }

  async changePassword(currentPassword, newPassword) {
    return await this.put('/profile/password', { currentPassword, newPassword });
  }

  async deleteAccount() {
    return await this.delete('/profile');
  }

  async getAnalytics() {
    return await this.get('/analytics');
  }

  async trackEvent(event, properties) {
    return await this.post('/events', { event, properties });
  }

  async trackScreen(screen) {
    return await this.post('/screens', { screen });
  }

  async trackError(error) {
    return await this.post('/errors', { error });
  }
}

export default new ApiService();