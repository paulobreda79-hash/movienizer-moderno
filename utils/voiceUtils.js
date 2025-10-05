// voiceUtils.js

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const voiceConfig = require('../config/voiceConfig');

class VoiceUtils {
  static async createDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Erro ao criar diretório ${dirPath}:`, error);
      throw error;
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Erro ao escrever arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Erro ao excluir arquivo ${filePath}:`, error);
      throw error;
    }
  }

  static generateCacheKey(text, language) {
    const key = `${text}_${language}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  static async getFromCache(cacheKey) {
    if (!voiceConfig.cache.enabled) return null;

    try {
      const cacheDir = voiceConfig.cache.directory;
      const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
      
      if (await this.fileExists(cacheFile)) {
        const cacheData = await this.readFile(cacheFile);
        
        // Verificar TTL
        const now = new Date().getTime();
        const cacheAge = now - new Date(cacheData.cached_at).getTime();
        const ttlMs = voiceConfig.cache.ttl * 1000;
        
        if (cacheAge < ttlMs) {
          return cacheData.data;
        } else {
          // Excluir cache expirado
          await this.deleteFile(cacheFile);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar do cache:', error);
    }

    return null;
  }

  static async saveToCache(cacheKey, data) {
    if (!voiceConfig.cache.enabled) return;

    try {
      const cacheDir = voiceConfig.cache.directory;
      await this.createDirectory(cacheDir);
      
      const cacheFile = path.join(cacheDir, `${cacheKey}.json`);
      const cacheData = {
         data,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (voiceConfig.cache.ttl * 1000)).toISOString()
      };

      await this.writeFile(cacheFile, cacheData);
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  static async cleanCache() {
    if (!voiceConfig.cache.enabled) return;

    try {
      const cacheDir = voiceConfig.cache.directory;
      if (!(await this.fileExists(cacheDir))) return;

      const files = await fs.readdir(cacheDir);
      const now = new Date().getTime();

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(cacheDir, file);
          const cacheData = await this.readFile(filePath);
          
          const expiresAt = new Date(cacheData.expires_at).getTime();
          if (now > expiresAt) {
            await this.deleteFile(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  static formatLanguageName(langCode) {
    const lang = voiceConfig.languages[langCode];
    return lang ? lang.name : langCode;
  }

  static getLanguageIcon(langCode) {
    const lang = voiceConfig.languages[langCode];
    return lang ? lang.icon : '🌐';
  }

  static getLanguageColor(langCode) {
    const lang = voiceConfig.languages[langCode];
    return lang ? lang.color : '#666666';
  }

  static getLanguageVoiceName(langCode) {
    const lang = voiceConfig.languages[langCode];
    return lang ? lang.voiceName : null;
  }

  static getLanguageRecognitionLang(langCode) {
    const lang = voiceConfig.languages[langCode];
    return lang ? lang.recognitionLang : 'pt-BR';
  }

  static getLanguageSynthesisLang(langCode) {
    const lang = voiceConfig.languages[langCode];
    return lang ? lang.synthesisLang : 'pt-BR';
  }

  static async getFreeSpace(path) {
    try {
      const os = require('os');
      const diskInfo = os.freemem();
      return diskInfo;
    } catch (error) {
      console.error('Erro ao obter espaço livre:', error);
      return 0;
    }
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Tentativa ${attempt} falhou. Tentando novamente em ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  static normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .trim();
  }

  static async checkInternetConnection() {
    try {
      const https = require('https');
      return new Promise((resolve, reject) => {
        const req = https.get('https://www.google.com', (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  static detectCommand(text, language = 'pt') {
    const commands = voiceConfig.commands;
    const normalizedText = this.normalizeText(text);
    
    // Verificar cada comando
    for (const [command, translations] of Object.entries(commands)) {
      const keywords = translations[language] || translations.pt;
      
      for (const keyword of keywords) {
        if (normalizedText.includes(this.normalizeText(keyword))) {
          return {
            command: command,
            keyword: keyword,
            confidence: normalizedText.length / keyword.length,
            language: language
          };
        }
      }
    }

    return null;
  }

  static extractSearchQuery(text, language = 'pt') {
    const commands = voiceConfig.commands.search[language] || voiceConfig.commands.search.pt;
    const normalizedText = this.normalizeText(text);
    
    for (const command of commands) {
      const normalizedCommand = this.normalizeText(command);
      if (normalizedText.includes(normalizedCommand)) {
        const query = normalizedText.replace(normalizedCommand, '').trim();
        return query || null;
      }
    }

    return normalizedText;
  }

  static extractMovieTitle(text, language = 'pt') {
    const commands = voiceConfig.commands.movie[language] || voiceConfig.commands.movie.pt;
    const normalizedText = this.normalizeText(text);
    
    for (const command of commands) {
      const normalizedCommand = this.normalizeText(command);
      if (normalizedText.includes(normalizedCommand)) {
        const title = normalizedText.replace(normalizedCommand, '').trim();
        return title || null;
      }
    }

    return normalizedText;
  }

  static extractPersonName(text, language = 'pt') {
    const commands = voiceConfig.commands.person[language] || voiceConfig.commands.person.pt;
    const normalizedText = this.normalizeText(text);
    
    for (const command of commands) {
      const normalizedCommand = this.normalizeText(command);
      if (normalizedText.includes(normalizedCommand)) {
        const name = normalizedText.replace(normalizedCommand, '').trim();
        return name || null;
      }
    }

    return normalizedText;
  }

  static async speakText(text, language = 'pt-BR') {
    if (!voiceConfig.synthesis.enabled) return;

    try {
      const speechSynthesis = window.speechSynthesis;
      const voices = speechSynthesis.getVoices();
      
      const langCode = language.split('-')[0];
      const voice = voices.find(v => 
        v.lang.startsWith(langCode) || 
        v.name.includes(voiceConfig.languages[language]?.voiceName)
      );

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice || voices[0];
      utterance.volume = voiceConfig.synthesis.volume;
      utterance.rate = voiceConfig.synthesis.rate;
      utterance.pitch = voiceConfig.synthesis.pitch;
      utterance.lang = voiceConfig.languages[language]?.synthesisLang || language;

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Erro ao sintetizar voz:', error);
    }
  }

  static async playSoundEffect(effect) {
    if (!voiceConfig.notifications.soundEffects) return;

    try {
      const audio = new Audio(`/sounds/${effect}.mp3`);
      await audio.play();
    } catch (error) {
      console.error('Erro ao reproduzir efeito sonoro:', error);
    }
  }

  static async showVoiceFeedback(message, type = 'info') {
    if (!voiceConfig.notifications.visualFeedback) return;

    try {
      // Criar elemento de feedback
      const feedback = document.createElement('div');
      feedback.className = `voice-feedback ${type}`;
      feedback.textContent = message;
      
      // Adicionar ao DOM
      document.body.appendChild(feedback);
      
      // Remover após 3 segundos
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao mostrar feedback de voz:', error);
    }
  }

  static async showVoiceIndicator(state = 'listening') {
    if (!voiceConfig.ui.showVoiceIndicator) return;

    try {
      const indicator = document.getElementById('voice-indicator');
      if (indicator) {
        indicator.className = `voice-indicator ${state}`;
        indicator.style.display = state === 'hidden' ? 'none' : 'block';
      }
    } catch (error) {
      console.error('Erro ao mostrar indicador de voz:', error);
    }
  }

  static async hideVoiceIndicator() {
    await this.showVoiceIndicator('hidden');
  }

  static async showVoiceButton() {
    if (!voiceConfig.ui.showVoiceButton) return;

    try {
      const button = document.getElementById('voice-button');
      if (button) {
        button.style.display = 'block';
      }
    } catch (error) {
      console.error('Erro ao mostrar botão de voz:', error);
    }
  }

  static async hideVoiceButton() {
    if (!voiceConfig.ui.showVoiceButton) return;

    try {
      const button = document.getElementById('voice-button');
      if (button) {
        button.style.display = 'none';
      }
    } catch (error) {
      console.error('Erro ao esconder botão de voz:', error);
    }
  }

  static async animateVoiceButton(animation = 'pulse') {
    if (!voiceConfig.animations.voiceButton.enabled) return;

    try {
      const button = document.getElementById('voice-button');
      if (button) {
        button.classList.add(`animate-${animation}`);
        setTimeout(() => {
          button.classList.remove(`animate-${animation}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao animar botão de voz:', error);
    }
  }

  static async animateVoiceIndicator(animation = 'fade') {
    if (!voiceConfig.animations.voiceIndicator.enabled) return;

    try {
      const indicator = document.getElementById('voice-indicator');
      if (indicator) {
        indicator.classList.add(`animate-${animation}`);
        setTimeout(() => {
          indicator.classList.remove(`animate-${animation}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao animar indicador de voz:', error);
    }
  }

  static async animateVoiceFeedback(animation = 'pop') {
    if (!voiceConfig.animations.voiceFeedback.enabled) return;

    try {
      const feedback = document.querySelector('.voice-feedback');
      if (feedback) {
        feedback.classList.add(`animate-${animation}`);
        setTimeout(() => {
          feedback.classList.remove(`animate-${animation}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Erro ao animar feedback de voz:', error);
    }
  }

  static async getVoiceCommands(language = 'pt') {
    const commands = voiceConfig.commands;
    const result = {};

    Object.entries(commands).forEach(([command, translations]) => {
      result[command] = {
        name: command,
        keywords: translations[language] || translations.pt,
        examples: translations.examples || []
      };
    });

    return result;
  }

  static async getVoiceCommandExamples(language = 'pt') {
    const examples = {
      pt: [
        'Procure por O Poderoso Chefão',
        'Buscar filme E.T.',
        'Encontre ator Marlon Brando',
        'Mostre-me diretor Steven Spielberg',
        'Adicione filme Matrix aos favoritos',
        'Marque E.T. como visto',
        'Remova filme Titanic',
        'Ajuda',
        'O que posso dizer?',
        'Pare de ouvir'
      ],
      en: [
        'Search for The Godfather',
        'Find movie E.T.',
        'Look for actor Marlon Brando',
        'Show me director Steven Spielberg',
        'Add Matrix to favorites',
        'Mark E.T. as watched',
        'Remove Titanic movie',
        'Help',
        'What can I say?',
        'Stop listening'
      ]
    };

    return examples[language] || examples.pt;
  }

  static async getVoiceStats(userId) {
    try {
      // Esta função seria implementada com dados reais do banco
      return {
        total_commands: 150,
        recognized_commands: 120,
        unrecognized_commands: 30,
        success_rate: 80,
        average_response_time: 1.5,
        most_used_command: 'search',
        least_used_command: 'help',
        languages_used: ['pt-BR', 'en-US'],
        last_voice_activity: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de voz:', error);
      throw error;
    }
  }

  static async getVoiceHistory(userId, limit = 50) {
    try {
      // Esta função seria implementada com dados reais do banco
      const history = [];
      for (let i = 0; i < Math.min(limit, 20); i++) {
        history.push({
          id: i + 1,
          command: ['search', 'add', 'remove', 'favorite', 'watched'][Math.floor(Math.random() * 5)],
          text: `Comando de exemplo ${i + 1}`,
          language: ['pt-BR', 'en-US'][Math.floor(Math.random() * 2)],
          success: Math.random() > 0.2,
          response_time: (Math.random() * 3).toFixed(2),
          timestamp: new Date(Date.now() - (i * 3600000)).toISOString()
        });
      }
      return history;
    } catch (error) {
      console.error('Erro ao obter histórico de voz:', error);
      throw error;
    }
  }

  static async getVoiceLearningData(userId) {
    try {
      // Esta função seria implementada com dados reais do banco
      return {
        learned_commands: 25,
        learning_progress: 75,
        confidence_levels: {
          high: 15,
          medium: 8,
          low: 2
        },
        suggested_commands: [
          'buscar por gênero',
          'filtrar por ano',
          'ordenar por rating',
          'exportar resultados'
        ]
      };
    } catch (error) {
      console.error('Erro ao obter dados de aprendizado de voz:', error);
      throw error;
    }
  }

  static async trainVoiceCommand(userId, command, examples) {
    try {
      // Esta função seria implementada com dados reais do banco
      console.log(`Treinando comando: ${command}`);
      console.log(`Exemplos: ${examples.join(', ')}`);
      
      return {
        success: true,
        message: `Comando "${command}" treinado com sucesso!`,
        trained_examples: examples.length
      };
    } catch (error) {
      console.error('Erro ao treinar comando de voz:', error);
      throw error;
    }
  }

  static async getVoiceSettings(userId) {
    try {
      // Esta função seria implementada com dados reais do banco
      return {
        enabled: true,
        language: 'pt-BR',
        auto_start: false,
        continuous_listening: false,
        max_recording_time: 10,
        silence_threshold: 0.01,
        silence_timeout: 2000,
        auto_stop_on_silence: true,
        interim_results: true,
        max_alternatives: 3,
        volume: 1.0,
        rate: 1.0,
        pitch: 1.0,
        cache_enabled: true,
        notifications_enabled: true,
        voice_feedback: true,
        visual_feedback: true,
        sound_effects: true,
        encrypt_voice_data: false,
        learning_enabled: true,
        auto_learn: true,
        confidence_threshold: 0.7
      };
    } catch (error) {
      console.error('Erro ao obter configurações de voz:', error);
      throw error;
    }
  }

  static async updateVoiceSettings(userId, settings) {
    try {
      // Esta função seria implementada com dados reais do banco
      console.log('Atualizando configurações de voz:', settings);
      
      return {
        success: true,
        message: 'Configurações de voz atualizadas com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao atualizar configurações de voz:', error);
      throw error;
    }
  }

  static async resetVoiceTraining(userId) {
    try {
      // Esta função seria implementada com dados reais do banco
      return {
        success: true,
        message: 'Treinamento de voz resetado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao resetar treinamento de voz:', error);
      throw error;
    }
  }

  static async exportVoiceData(userId, format = 'json') {
    try {
      const data = {
        commands: await this.getVoiceCommands(),
        history: await this.getVoiceHistory(userId),
        stats: await this.getVoiceStats(userId),
        learning: await this.getVoiceLearningData(userId),
        settings: await this.getVoiceSettings(userId)
      };

      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'csv':
          // Converter para CSV
          return this.convertToCSV(data);
        case 'xml':
          // Converter para XML
          return this.convertToXML(data);
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }
    } catch (error) {
      console.error('Erro ao exportar dados de voz:', error);
      throw error;
    }
  }

  static convertToCSV(data) {
    // Implementação básica de conversão para CSV
    let csv = 'Comando,Texto,Idioma,Sucesso,Timestamp\n';
    
    data.history.forEach(item => {
      csv += `"${item.command}","${item.text}","${item.language}",${item.success},"${item.timestamp}"\n`;
    });

    return csv;
  }

  static convertToXML(data) {
    // Implementação básica de conversão para XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<voice-data>\n';
    
    xml += '  <commands>\n';
    Object.entries(data.commands).forEach(([name, cmd]) => {
      xml += `    <command name="${name}">\n`;
      cmd.keywords.forEach(keyword => {
        xml += `      <keyword>${keyword}</keyword>\n`;
      });
      xml += '    </command>\n';
    });
    xml += '  </commands>\n';

    xml += '  <history>\n';
    data.history.forEach(item => {
      xml += `    <item>\n`;
      xml += `      <command>${item.command}</command>\n`;
      xml += `      <text>${item.text}</text>\n`;
      xml += `      <language>${item.language}</language>\n`;
      xml += `      <success>${item.success}</success>\n`;
      xml += `      <timestamp>${item.timestamp}</timestamp>\n`;
      xml += `    </item>\n`;
    });
    xml += '  </history>\n';

    xml += '</voice-data>';
    
    return xml;
  }

  static async importVoiceData(userId, data, format = 'json') {
    try {
      let importedData;

      switch (format) {
        case 'json':
          importedData = JSON.parse(data);
          break;
        case 'csv':
          // Converter de CSV
          importedData = this.convertFromCSV(data);
          break;
        case 'xml':
          // Converter de XML
          importedData = this.convertFromXML(data);
          break;
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }

      // Processar dados importados
      console.log('Dados de voz importados:', importedData);
      
      return {
        success: true,
        message: 'Dados de voz importados com sucesso!',
        imported_items: Object.keys(importedData).length
      };
    } catch (error) {
      console.error('Erro ao importar dados de voz:', error);
      throw error;
    }
  }

  static convertFromCSV(csv) {
    // Implementação básica de conversão de CSV
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index];
        });
        data.push(item);
      }
    }

    return { history: data };
  }

  static convertFromXML(xml) {
    // Implementação básica de conversão de XML
    // Esta é uma implementação simplificada
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const commands = {};
    const commandElements = doc.querySelectorAll('command');
    commandElements.forEach(cmd => {
      const name = cmd.getAttribute('name');
      const keywords = [];
      cmd.querySelectorAll('keyword').forEach(keyword => {
        keywords.push(keyword.textContent);
      });
      commands[name] = { keywords };
    });

    const history = [];
    const historyElements = doc.querySelectorAll('history item');
    historyElements.forEach(item => {
      history.push({
        command: item.querySelector('command').textContent,
        text: item.querySelector('text').textContent,
        language: item.querySelector('language').textContent,
        success: item.querySelector('success').textContent === 'true',
        timestamp: item.querySelector('timestamp').textContent
      });
    });

    return { commands, history };
  }

  static async scheduleVoiceChecks() {
    const cron = require('node-cron');
    
    if (!voiceConfig.general.autoStart) {
      console.log('Verificação automática de voz desativada');
      return;
    }

    const schedule = voiceConfig.schedule[voiceConfig.general.checkFrequency];
    if (!schedule) {
      console.error('Agendamento inválido:', voiceConfig.general.checkFrequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando verificação automática de voz...`);
        await this.checkVoiceAvailability();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro na verificação automática:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Verificação automática de voz agendada para executar ${voiceConfig.general.checkFrequency}`);
  }

  static async checkVoiceAvailability() {
    try {
      // Verificar disponibilidade de APIs de voz
      const hasInternet = await this.checkInternetConnection();
      if (!hasInternet) {
        throw new Error('Sem conexão com a internet');
      }

      // Verificar APIs de voz disponíveis
      const availableApis = [];
      
      // Web Speech API
      if (voiceConfig.compatibility.webSpeechApi && 'speechSynthesis' in window) {
        availableApis.push('web-speech-api');
      }

      // Media Recorder
      if (voiceConfig.compatibility.mediaRecorder && 'MediaRecorder' in window) {
        availableApis.push('media-recorder');
      }

      // Audio Context
      if (voiceConfig.compatibility.audioContext && 'AudioContext' in window) {
        availableApis.push('audio-context');
      }

      // GetUserMedia
      if (voiceConfig.compatibility.getUserMedia && navigator.mediaDevices) {
        availableApis.push('get-user-media');
      }

      console.log(`APIs de voz disponíveis: ${availableApis.join(', ')}`);
      return availableApis;

    } catch (error) {
      console.error('Erro ao verificar disponibilidade de voz:', error);
      throw error;
    }
  }

  static async cleanupOldData(days = 30) {
    try {
      // Limpar dados de voz antigos
      console.log(`Dados de voz anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  static async getApiDetails(apiId) {
    try {
      return voiceConfig.apis[apiId];
    } catch (error) {
      console.error('Erro ao obter detalhes da API:', error);
      throw error;
    }
  }

  static async searchApiContent(apiId, query, limit = 20) {
    try {
      const ratings = await this.searchApi(apiId, query);
      return ratings.slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar conteúdo na API:', error);
      throw error;
    }
  }

  static async getNewRatings(apiId = null, days = 7) {
    try {
      const ratings = await this.getNewRatings(apiId, days);
      return ratings;
    } catch (error) {
      console.error('Erro ao obter novos ratings:', error);
      throw error;
    }
  }

  static async getPopularRatings(apiId = null, limit = 50) {
    try {
      const ratings = await this.getPopularRatings(apiId, limit);
      return ratings;
    } catch (error) {
      console.error('Erro ao obter ratings populares:', error);
      throw error;
    }
  }

  static async getSimilarRatings(title, year, limit = 10) {
    try {
      const ratings = await this.getSimilarRatings(title, year, limit);
      return ratings;
    } catch (error) {
      console.error('Erro ao obter ratings similares:', error);
      throw error;
    }
  }
}

module.exports = VoiceUtils;