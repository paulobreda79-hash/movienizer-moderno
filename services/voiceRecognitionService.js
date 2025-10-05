// voiceRecognitionService.js

const voiceConfig = require('../config/voiceConfig');
const VoiceUtils = require('../utils/voiceUtils');
const db = require('../data/database/init');

class VoiceRecognitionService {
  constructor() {
    this.recognition = null;
    this.synthesis = null;
    this.isListening = false;
    this.currentLanguage = voiceConfig.general.lang;
    this.commandHistory = [];
    this.learningData = {};
    this.cache = new Map();
  }

  async initialize() {
    try {
      // Verificar compatibilidade
      const availableApis = await VoiceUtils.checkVoiceAvailability();
      
      if (availableApis.includes('web-speech-api')) {
        this.setupWebSpeechAPI();
      }

      if (availableApis.includes('media-recorder')) {
        this.setupMediaRecorder();
      }

      // Carregar dados de aprendizado
      await this.loadLearningData();

      console.log('Serviço de reconhecimento de voz inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar serviço de voz:', error);
      throw error;
    }
  }

  setupWebSpeechAPI() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('API de reconhecimento de voz não suportada');
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = voiceConfig.recognition.continuous;
      this.recognition.interimResults = voiceConfig.recognition.interimResults;
      this.recognition.maxAlternatives = voiceConfig.recognition.maxAlternatives;
      this.recognition.lang = VoiceUtils.getLanguageRecognitionLang(this.currentLanguage);

      this.recognition.onresult = (event) => this.handleRecognitionResult(event);
      this.recognition.onerror = (event) => this.handleRecognitionError(event);
      this.recognition.onend = () => this.handleRecognitionEnd();

      this.synthesis = window.speechSynthesis;

      console.log('Web Speech API configurada com sucesso!');
    } catch (error) {
      console.error('Erro ao configurar Web Speech API:', error);
    }
  }

  setupMediaRecorder() {
    try {
      // Configurar MediaRecorder para gravação de áudio
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          this.mediaRecorder = new MediaRecorder(stream);
          this.audioChunks = [];
          
          this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
          };
          
          this.mediaRecorder.onstop = () => {
            this.processAudioRecording();
          };
          
          console.log('MediaRecorder configurado com sucesso!');
        })
        .catch(error => {
          console.error('Erro ao configurar MediaRecorder:', error);
        });
    } catch (error) {
      console.error('Erro ao configurar MediaRecorder:', error);
    }
  }

  async startListening() {
    try {
      if (!this.recognition) {
        throw new Error('Reconhecimento de voz não configurado');
      }

      if (this.isListening) {
        console.log('Já está ouvindo...');
        return;
      }

      // Verificar conexão com internet
      const hasInternet = await VoiceUtils.checkInternetConnection();
      if (!hasInternet) {
        throw new Error('Sem conexão com a internet');
      }

      this.isListening = true;
      this.recognition.start();

      // Notificar usuário
      if (voiceConfig.notifications.recordingStarted) {
        await VoiceUtils.showVoiceFeedback('Comece a falar...', 'info');
        await VoiceUtils.showVoiceIndicator('listening');
        await VoiceUtils.animateVoiceButton('pulse');
        await VoiceUtils.playSoundEffect('start');
      }

      console.log('Reconhecimento de voz iniciado');
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento de voz:', error);
      this.isListening = false;
      throw error;
    }
  }

  async stopListening() {
    try {
      if (!this.recognition || !this.isListening) {
        console.log('Não está ouvindo...');
        return;
      }

      this.isListening = false;
      this.recognition.stop();

      // Notificar usuário
      if (voiceConfig.notifications.recordingStopped) {
        await VoiceUtils.hideVoiceIndicator();
        await VoiceUtils.playSoundEffect('stop');
      }

      console.log('Reconhecimento de voz parado');
    } catch (error) {
      console.error('Erro ao parar reconhecimento de voz:', error);
      this.isListening = false;
      throw error;
    }
  }

  handleRecognitionResult(event) {
    try {
      const results = event.results;
      const result = results[event.resultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;

      // Processar resultado
      this.processVoiceCommand(transcript, confidence);

      // Mostrar resultado intermediário se configurado
      if (result.isFinal) {
        console.log(`Comando reconhecido: "${transcript}" (Confiança: ${confidence})`);
      } else if (voiceConfig.recognition.interimResults) {
        console.log(`Resultado intermediário: "${transcript}"`);
      }

    } catch (error) {
      console.error('Erro ao processar resultado de reconhecimento:', error);
    }
  }

  async processVoiceCommand(text, confidence) {
    try {
      // Verificar confiança mínima
      if (confidence < voiceConfig.learning.confidenceThreshold) {
        console.log(`Comando ignorado devido à baixa confiança: ${confidence}`);
        return;
      }

      // Gerar chave de cache
      const cacheKey = VoiceUtils.generateCacheKey(text, this.currentLanguage);
      
      // Verificar cache
      let processedCommand = await VoiceUtils.getFromCache(cacheKey);
      if (processedCommand) {
        console.log(`Comando recuperado do cache: ${text}`);
        await this.executeCommand(processedCommand);
        return;
      }

      // Processar comando
      processedCommand = await this.analyzeCommand(text, confidence);

      // Salvar no cache
      await VoiceUtils.saveToCache(cacheKey, processedCommand);

      // Executar comando
      await this.executeCommand(processedCommand);

      // Salvar no histórico
      await this.saveCommandToHistory(text, processedCommand, confidence);

      // Aprender comando se configurado
      if (voiceConfig.learning.autoLearn) {
        await this.learnCommand(text, processedCommand);
      }

    } catch (error) {
      console.error('Erro ao processar comando de voz:', error);
      await this.handleCommandError(text, error);
    }
  }

  async analyzeCommand(text, confidence) {
    try {
      const command = VoiceUtils.detectCommand(text, this.currentLanguage);
      const searchQuery = VoiceUtils.extractSearchQuery(text, this.currentLanguage);
      const movieTitle = VoiceUtils.extractMovieTitle(text, this.currentLanguage);
      const personName = VoiceUtils.extractPersonName(text, this.currentLanguage);

      return {
        originalText: text,
        command: command ? command.command : 'unknown',
        keyword: command ? command.keyword : null,
        searchQuery: searchQuery,
        movieTitle: movieTitle,
        personName: personName,
        confidence: confidence,
        language: this.currentLanguage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao analisar comando:', error);
      throw error;
    }
  }

  async executeCommand(commandData) {
    try {
      switch (commandData.command) {
        case 'search':
          await this.executeSearchCommand(commandData);
          break;
        case 'movie':
          await this.executeMovieCommand(commandData);
          break;
        case 'person':
          await this.executePersonCommand(commandData);
          break;
        case 'add':
          await this.executeAddCommand(commandData);
          break;
        case 'remove':
          await this.executeRemoveCommand(commandData);
          break;
        case 'favorite':
          await this.executeFavoriteCommand(commandData);
          break;
        case 'watched':
          await this.executeWatchedCommand(commandData);
          break;
        case 'help':
          await this.executeHelpCommand(commandData);
          break;
        case 'stop':
          await this.executeStopCommand(commandData);
          break;
        case 'play':
          await this.executePlayCommand(commandData);
          break;
        case 'pause':
          await this.executePauseCommand(commandData);
          break;
        case 'next':
          await this.executeNextCommand(commandData);
          break;
        case 'previous':
          await this.executePreviousCommand(commandData);
          break;
        default:
          await this.executeUnknownCommand(commandData);
      }

      // Notificar usuário
      if (voiceConfig.notifications.commandRecognized) {
        await VoiceUtils.showVoiceFeedback(`Comando "${commandData.command}" executado com sucesso!`, 'success');
        await VoiceUtils.playSoundEffect('success');
      }

    } catch (error) {
      console.error('Erro ao executar comando:', error);
      await this.handleCommandExecutionError(commandData, error);
    }
  }

  async executeSearchCommand(commandData) {
    try {
      const query = commandData.searchQuery || commandData.movieTitle || commandData.personName;
      if (!query) {
        throw new Error('Consulta de busca não fornecida');
      }

      // Buscar no banco de dados
      const movies = await this.searchMovies(query);
      const people = await this.searchPeople(query);

      // Mostrar resultados
      await this.showSearchResults(query, movies, people);

      // Falar resultados se configurado
      if (voiceConfig.synthesis.enabled) {
        const resultCount = movies.length + people.length;
        const message = `Encontrei ${resultCount} resultados para "${query}".`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de busca:', error);
      throw error;
    }
  }

  async executeMovieCommand(commandData) {
    try {
      const title = commandData.movieTitle;
      if (!title) {
        throw new Error('Título do filme não fornecido');
      }

      // Buscar filme
      const movie = await this.searchMovie(title);
      if (!movie) {
        throw new Error(`Filme "${title}" não encontrado`);
      }

      // Mostrar detalhes do filme
      await this.showMovieDetails(movie);

      // Falar detalhes se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = `Filme encontrado: ${movie.title}, dirigido por ${movie.director}.`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de filme:', error);
      throw error;
    }
  }

  async executePersonCommand(commandData) {
    try {
      const name = commandData.personName;
      if (!name) {
        throw new Error('Nome da pessoa não fornecido');
      }

      // Buscar pessoa
      const person = await this.searchPerson(name);
      if (!person) {
        throw new Error(`Pessoa "${name}" não encontrada`);
      }

      // Mostrar detalhes da pessoa
      await this.showPersonDetails(person);

      // Falar detalhes se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = `Pessoa encontrada: ${person.name}, nascido em ${person.birth_date}.`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de pessoa:', error);
      throw error;
    }
  }

  async executeAddCommand(commandData) {
    try {
      const title = commandData.movieTitle || commandData.personName;
      if (!title) {
        throw new Error('Título ou nome não fornecido');
      }

      // Adicionar filme ou pessoa
      if (commandData.movieTitle) {
        await this.addMovie(title);
      } else if (commandData.personName) {
        await this.addPerson(title);
      }

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = `"${title}" adicionado com sucesso!`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de adição:', error);
      throw error;
    }
  }

  async executeRemoveCommand(commandData) {
    try {
      const title = commandData.movieTitle || commandData.personName;
      if (!title) {
        throw new Error('Título ou nome não fornecido');
      }

      // Remover filme ou pessoa
      if (commandData.movieTitle) {
        await this.removeMovie(title);
      } else if (commandData.personName) {
        await this.removePerson(title);
      }

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = `"${title}" removido com sucesso!`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de remoção:', error);
      throw error;
    }
  }

  async executeFavoriteCommand(commandData) {
    try {
      const title = commandData.movieTitle || commandData.personName;
      if (!title) {
        throw new Error('Título ou nome não fornecido');
      }

      // Marcar como favorito
      if (commandData.movieTitle) {
        await this.favoriteMovie(title);
      } else if (commandData.personName) {
        await this.favoritePerson(title);
      }

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = `"${title}" marcado como favorito!`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de favorito:', error);
      throw error;
    }
  }

  async executeWatchedCommand(commandData) {
    try {
      const title = commandData.movieTitle;
      if (!title) {
        throw new Error('Título do filme não fornecido');
      }

      // Marcar como visto
      await this.watchMovie(title);

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = `"${title}" marcado como visto!`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de visto:', error);
      throw error;
    }
  }

  async executeHelpCommand(commandData) {
    try {
      // Mostrar ajuda
      await this.showHelp();

      // Falar comandos disponíveis se configurado
      if (voiceConfig.synthesis.enabled) {
        const examples = await VoiceUtils.getVoiceCommandExamples(this.currentLanguage);
        const message = `Você pode dizer: ${examples.slice(0, 3).join(', ')}, e muitos outros comandos.`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de ajuda:', error);
      throw error;
    }
  }

  async executeStopCommand(commandData) {
    try {
      // Parar escuta
      await this.stopListening();

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = 'Escuta parada.';
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de parada:', error);
      throw error;
    }
  }

  async executePlayCommand(commandData) {
    try {
      const title = commandData.movieTitle;
      if (!title) {
        throw new Error('Título do filme não fornecido');
      }

      // Reproduzir filme
      await this.playMovie(title);

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = `Reproduzindo "${title}"...`;
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de reprodução:', error);
      throw error;
    }
  }

  async executePauseCommand(commandData) {
    try {
      // Pausar reprodução
      await this.pauseMovie();

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = 'Reprodução pausada.';
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de pausa:', error);
      throw error;
    }
  }

  async executeNextCommand(commandData) {
    try {
      // Próximo item
      await this.nextItem();

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = 'Próximo item.';
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de próximo:', error);
      throw error;
    }
  }

  async executePreviousCommand(commandData) {
    try {
      // Item anterior
      await this.previousItem();

      // Falar confirmação se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = 'Item anterior.';
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

    } catch (error) {
      console.error('Erro ao executar comando de anterior:', error);
      throw error;
    }
  }

  async executeUnknownCommand(commandData) {
    try {
      // Falar comando desconhecido se configurado
      if (voiceConfig.synthesis.enabled) {
        const message = 'Comando desconhecido. Diga "ajuda" para ver os comandos disponíveis.';
        await VoiceUtils.speakText(message, this.currentLanguage);
      }

      // Notificar usuário
      if (voiceConfig.notifications.commandNotFound) {
        await VoiceUtils.showVoiceFeedback('Comando não reconhecido. Diga "ajuda" para ver os comandos disponíveis.', 'warning');
        await VoiceUtils.playSoundEffect('error');
      }

      console.log(`Comando desconhecido: "${commandData.originalText}"`);
    } catch (error) {
      console.error('Erro ao executar comando desconhecido:', error);
    }
  }

  async searchMovies(query) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM movies 
        WHERE title LIKE ? OR plot LIKE ?
        ORDER BY rating_imdb DESC
        LIMIT 10
      `);
      return stmt.all(`%${query}%`, `%${query}%`);
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
      throw error;
    }
  }

  async searchPeople(query) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM people 
        WHERE name LIKE ? OR full_name LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
      `);
      return stmt.all(`%${query}%`, `%${query}%`);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
      throw error;
    }
  }

  async searchMovie(title) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM movies 
        WHERE title LIKE ?
        ORDER BY rating_imdb DESC
        LIMIT 1
      `);
      return stmt.get(`%${title}%`);
    } catch (error) {
      console.error('Erro ao buscar filme:', error);
      throw error;
    }
  }

  async searchPerson(name) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM people 
        WHERE name LIKE ? OR full_name LIKE ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
      return stmt.get(`%${name}%`, `%${name}%`);
    } catch (error) {
      console.error('Erro ao buscar pessoa:', error);
      throw error;
    }
  }

  async addMovie(title) {
    try {
      // Aqui você implementaria a lógica para adicionar um filme
      console.log(`Adicionando filme: ${title}`);
      return { success: true, message: `Filme "${title}" adicionado com sucesso!` };
    } catch (error) {
      console.error('Erro ao adicionar filme:', error);
      throw error;
    }
  }

  async addPerson(name) {
    try {
      // Aqui você implementaria a lógica para adicionar uma pessoa
      console.log(`Adicionando pessoa: ${name}`);
      return { success: true, message: `Pessoa "${name}" adicionada com sucesso!` };
    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error);
      throw error;
    }
  }

  async removeMovie(title) {
    try {
      // Aqui você implementaria a lógica para remover um filme
      console.log(`Removendo filme: ${title}`);
      return { success: true, message: `Filme "${title}" removido com sucesso!` };
    } catch (error) {
      console.error('Erro ao remover filme:', error);
      throw error;
    }
  }

  async removePerson(name) {
    try {
      // Aqui você implementaria a lógica para remover uma pessoa
      console.log(`Removendo pessoa: ${name}`);
      return { success: true, message: `Pessoa "${name}" removida com sucesso!` };
    } catch (error) {
      console.error('Erro ao remover pessoa:', error);
      throw error;
    }
  }

  async favoriteMovie(title) {
    try {
      // Aqui você implementaria a lógica para favoritar um filme
      console.log(`Favoritando filme: ${title}`);
      return { success: true, message: `Filme "${title}" favoritado com sucesso!` };
    } catch (error) {
      console.error('Erro ao favoritar filme:', error);
      throw error;
    }
  }

  async favoritePerson(name) {
    try {
      // Aqui você implementaria a lógica para favoritar uma pessoa
      console.log(`Favoritando pessoa: ${name}`);
      return { success: true, message: `Pessoa "${name}" favoritada com sucesso!` };
    } catch (error) {
      console.error('Erro ao favoritar pessoa:', error);
      throw error;
    }
  }

  async watchMovie(title) {
    try {
      // Aqui você implementaria a lógica para marcar um filme como visto
      console.log(`Marcando filme como visto: ${title}`);
      return { success: true, message: `Filme "${title}" marcado como visto com sucesso!` };
    } catch (error) {
      console.error('Erro ao marcar filme como visto:', error);
      throw error;
    }
  }

  async playMovie(title) {
    try {
      // Aqui você implementaria a lógica para reproduzir um filme
      console.log(`Reproduzindo filme: ${title}`);
      return { success: true, message: `Filme "${title}" em reprodução!` };
    } catch (error) {
      console.error('Erro ao reproduzir filme:', error);
      throw error;
    }
  }

  async pauseMovie() {
    try {
      // Aqui você implementaria a lógica para pausar a reprodução
      console.log('Pausando reprodução');
      return { success: true, message: 'Reprodução pausada!' };
    } catch (error) {
      console.error('Erro ao pausar reprodução:', error);
      throw error;
    }
  }

  async nextItem() {
    try {
      // Aqui você implementaria a lógica para ir para o próximo item
      console.log('Próximo item');
      return { success: true, message: 'Próximo item!' };
    } catch (error) {
      console.error('Erro ao ir para o próximo item:', error);
      throw error;
    }
  }

  async previousItem() {
    try {
      // Aqui você implementaria a lógica para voltar ao item anterior
      console.log('Item anterior');
      return { success: true, message: 'Item anterior!' };
    } catch (error) {
      console.error('Erro ao voltar ao item anterior:', error);
      throw error;
    }
  }

  async showSearchResults(query, movies, people) {
    try {
      // Aqui você implementaria a lógica para mostrar resultados de busca
      console.log(`Resultados para "${query}":`, { movies, people });
      
      // Atualizar interface
      if (window.updateSearchResults) {
        window.updateSearchResults(query, movies, people);
      }
    } catch (error) {
      console.error('Erro ao mostrar resultados de busca:', error);
      throw error;
    }
  }

  async showMovieDetails(movie) {
    try {
      // Aqui você implementaria a lógica para mostrar detalhes do filme
      console.log('Detalhes do filme:', movie);
      
      // Atualizar interface
      if (window.showMovieDetails) {
        window.showMovieDetails(movie);
      }
    } catch (error) {
      console.error('Erro ao mostrar detalhes do filme:', error);
      throw error;
    }
  }

  async showPersonDetails(person) {
    try {
      // Aqui você implementaria a lógica para mostrar detalhes da pessoa
      console.log('Detalhes da pessoa:', person);
      
      // Atualizar interface
      if (window.showPersonDetails) {
        window.showPersonDetails(person);
      }
    } catch (error) {
      console.error('Erro ao mostrar detalhes da pessoa:', error);
      throw error;
    }
  }

  async showHelp() {
    try {
      // Aqui você implementaria a lógica para mostrar ajuda
      console.log('Mostrando ajuda');
      
      // Atualizar interface
      if (window.showVoiceHelp) {
        window.showVoiceHelp();
      }
    } catch (error) {
      console.error('Erro ao mostrar ajuda:', error);
      throw error;
    }
  }

  async saveCommandToHistory(text, commandData, confidence) {
    try {
      this.commandHistory.push({
        text: text,
        command: commandData.command,
        confidence: confidence,
        timestamp: new Date().toISOString()
      });

      // Limitar histórico
      if (this.commandHistory.length > 100) {
        this.commandHistory = this.commandHistory.slice(-100);
      }

      // Salvar no banco de dados
      const stmt = db.prepare(`
        INSERT INTO voice_commands (
          text, command, confidence, language, success, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        text,
        commandData.command,
        confidence,
        this.currentLanguage,
        1, // success
        new Date().toISOString()
      );

    } catch (error) {
      console.error('Erro ao salvar comando no histórico:', error);
    }
  }

  async loadLearningData() {
    try {
      const stmt = db.prepare(`
        SELECT * FROM voice_learning 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(1); // userId placeholder

      this.learningData = {};
      rows.forEach(row => {
        this.learningData[row.command] = {
          examples: JSON.parse(row.examples || '[]'),
          confidence: row.confidence,
          last_used: row.last_used
        };
      });

    } catch (error) {
      console.error('Erro ao carregar dados de aprendizado:', error);
    }
  }

  async learnCommand(text, commandData) {
    try {
      if (!this.learningData[commandData.command]) {
        this.learningData[commandData.command] = {
          examples: [],
          confidence: 0,
          last_used: new Date().toISOString()
        };
      }

      // Adicionar exemplo
      this.learningData[commandData.command].examples.push(text);
      this.learningData[commandData.command].confidence = commandData.confidence;
      this.learningData[commandData.command].last_used = new Date().toISOString();

      // Limitar exemplos
      if (this.learningData[commandData.command].examples.length > 50) {
        this.learningData[commandData.command].examples = 
          this.learningData[commandData.command].examples.slice(-50);
      }

      // Salvar no banco de dados
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO voice_learning (
          user_id, command, examples, confidence, last_used, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        1, // userId placeholder
        commandData.command,
        JSON.stringify(this.learningData[commandData.command].examples),
        commandData.confidence,
        this.learningData[commandData.command].last_used,
        new Date().toISOString()
      );

    } catch (error) {
      console.error('Erro ao aprender comando:', error);
    }
  }

  async handleRecognitionError(event) {
    try {
      console.error('Erro de reconhecimento de voz:', event.error);
      
      // Notificar usuário
      if (voiceConfig.notifications.errorOccurred) {
        await VoiceUtils.showVoiceFeedback(`Erro: ${event.error}`, 'error');
        await VoiceUtils.playSoundEffect('error');
      }

      this.isListening = false;
    } catch (error) {
      console.error('Erro ao lidar com erro de reconhecimento:', error);
    }
  }

  async handleRecognitionEnd() {
    try {
      console.log('Reconhecimento de voz encerrado');
      
      // Reiniciar se configurado para escuta contínua
      if (voiceConfig.general.continuousListening && this.isListening) {
        await VoiceUtils.sleep(1000);
        await this.startListening();
      } else {
        this.isListening = false;
        await VoiceUtils.hideVoiceIndicator();
      }

    } catch (error) {
      console.error('Erro ao lidar com fim do reconhecimento:', error);
    }
  }

  async handleCommandError(text, error) {
    try {
      console.error('Erro ao processar comando de voz:', error);
      
      // Salvar erro no histórico
      const stmt = db.prepare(`
        INSERT INTO voice_commands (
          text, command, confidence, language, success, error_message, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        text,
        'error',
        0,
        this.currentLanguage,
        0, // success = false
        error.message,
        new Date().toISOString()
      );

      // Notificar usuário
      if (voiceConfig.notifications.errorOccurred) {
        await VoiceUtils.showVoiceFeedback(`Erro: ${error.message}`, 'error');
        await VoiceUtils.playSoundEffect('error');
      }

    } catch (innerError) {
      console.error('Erro ao lidar com erro de comando:', innerError);
    }
  }

  async handleCommandExecutionError(commandData, error) {
    try {
      console.error(`Erro ao executar comando ${commandData.command}:`, error);
      
      // Notificar usuário
      if (voiceConfig.notifications.errorOccurred) {
        await VoiceUtils.showVoiceFeedback(`Erro ao executar comando: ${error.message}`, 'error');
        await VoiceUtils.playSoundEffect('error');
      }

    } catch (innerError) {
      console.error('Erro ao lidar com erro de execução:', innerError);
    }
  }

  async generatePDFReport() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;

      // Título
      doc.setFontSize(20);
      doc.text('Relatório de Voz - MovieNizer', pageWidth / 2, 20, { align: 'center' });

      // Data
      const today = new Date();
      doc.setFontSize(12);
      doc.text(`Data: ${today.toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

      // Resumo
      doc.setFontSize(14);
      doc.text('Resumo Geral', margin, 45);
      doc.setFontSize(12);
      doc.text(`Total de Comandos: ${this.commandHistory.length}`, margin, 55);
      doc.text(`Comandos Reconhecidos: ${this.commandHistory.filter(c => c.success).length}`, margin, 60);
      doc.text(`Comandos Não Reconhecidos: ${this.commandHistory.filter(c => !c.success).length}`, margin, 65);

      // Histórico de comandos
      let yPos = 75;
      doc.text('Histórico de Comandos', margin, yPos);
      yPos += 10;

      const recentCommands = this.commandHistory.slice(-20);
      recentCommands.forEach((cmd, index) => {
        doc.text(`${index + 1}. "${cmd.text}" - ${cmd.command} (${cmd.confidence.toFixed(2)})`, margin, yPos);
        yPos += 8;
      });

      // Dados de aprendizado
      yPos += 10;
      doc.text('Dados de Aprendizado', margin, yPos);
      yPos += 10;

      Object.entries(this.learningData).forEach(([command, data], index) => {
        doc.text(`${index + 1}. ${command}: ${data.examples.length} exemplos`, margin, yPos);
        yPos += 8;
      });

      doc.save(`relatorio-voz-${today.toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw error;
    }
  }

  async exportVoiceData(format = 'json') {
    try {
      const data = {
        commands: this.commandHistory,
        learning: this.learningData,
        config: voiceConfig
      };

      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'csv':
          return this.convertToCSV(data);
        case 'xml':
          return this.convertToXML(data);
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }
    } catch (error) {
      console.error('Erro ao exportar dados de voz:', error);
      throw error;
    }
  }

  convertToCSV(data) {
    let csv = 'Texto,Comando,Confiança,Idioma,Sucesso,Timestamp\n';
    
    data.commands.forEach(cmd => {
      csv += `"${cmd.text}","${cmd.command}",${cmd.confidence},"${cmd.language}",${cmd.success},"${cmd.timestamp}"\n`;
    });

    return csv;
  }

  convertToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<voice-data>\n';
    
    xml += '  <commands>\n';
    data.commands.forEach(cmd => {
      xml += `    <command>\n`;
      xml += `      <text>${cmd.text}</text>\n`;
      xml += `      <command>${cmd.command}</command>\n`;
      xml += `      <confidence>${cmd.confidence}</confidence>\n`;
      xml += `      <language>${cmd.language}</language>\n`;
      xml += `      <success>${cmd.success}</success>\n`;
      xml += `      <timestamp>${cmd.timestamp}</timestamp>\n`;
      xml += `    </command>\n`;
    });
    xml += '  </commands>\n';

    xml += '  <learning>\n';
    Object.entries(data.learning).forEach(([command, learning]) => {
      xml += `    <command name="${command}">\n`;
      xml += `      <confidence>${learning.confidence}</confidence>\n`;
      xml += `      <last_used>${learning.last_used}</last_used>\n`;
      xml += `      <examples>\n`;
      learning.examples.forEach(example => {
        xml += `        <example>${example}</example>\n`;
      });
      xml += `      </examples>\n`;
      xml += `    </command>\n`;
    });
    xml += '  </learning>\n';

    xml += '</voice-data>';
    
    return xml;
  }

  async importVoiceData(data, format = 'json') {
    try {
      let importedData;

      switch (format) {
        case 'json':
          importedData = JSON.parse(data);
          break;
        case 'csv':
          importedData = this.convertFromCSV(data);
          break;
        case 'xml':
          importedData = this.convertFromXML(data);
          break;
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }

      // Processar dados importados
      this.commandHistory = importedData.commands || [];
      this.learningData = importedData.learning || {};

      console.log('Dados de voz importados com sucesso!');
      return { success: true, message: 'Dados de voz importados com sucesso!' };

    } catch (error) {
      console.error('Erro ao importar dados de voz:', error);
      throw error;
    }
  }

  convertFromCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const commands = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
        const command = {};
        headers.forEach((header, index) => {
          command[header] = values[index];
        });
        commands.push(command);
      }
    }

    return { commands };
  }

  convertFromXML(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const commands = [];
    const commandElements = doc.querySelectorAll('commands command');
    commandElements.forEach(cmd => {
      commands.push({
        text: cmd.querySelector('text').textContent,
        command: cmd.querySelector('command').textContent,
        confidence: parseFloat(cmd.querySelector('confidence').textContent),
        language: cmd.querySelector('language').textContent,
        success: cmd.querySelector('success').textContent === 'true',
        timestamp: cmd.querySelector('timestamp').textContent
      });
    });

    const learning = {};
    const learningElements = doc.querySelectorAll('learning command');
    learningElements.forEach(cmd => {
      const name = cmd.getAttribute('name');
      learning[name] = {
        confidence: parseFloat(cmd.querySelector('confidence').textContent),
        last_used: cmd.querySelector('last_used').textContent,
        examples: Array.from(cmd.querySelectorAll('examples example')).map(e => e.textContent)
      };
    });

    return { commands, learning };
  }

  async scheduleAutoCheck() {
    const cron = require('node-cron');
    
    if (!voiceConfig.general.autoUpdate) {
      console.log('Verificação automática de voz desativada');
      return;
    }

    const schedule = voiceConfig.schedule[voiceConfig.general.updateFrequency];
    if (!schedule) {
      console.error('Agendamento inválido:', voiceConfig.general.updateFrequency);
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

    console.log(`Verificação automática de voz agendada para executar ${voiceConfig.general.updateFrequency}`);
  }

  async checkVoiceAvailability() {
    try {
      // Verificar disponibilidade de APIs de voz
      const hasInternet = await VoiceUtils.checkInternetConnection();
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

  async cleanupOldData(days = 30) {
    try {
      // Limpar dados de voz antigos
      const stmt = db.prepare(`
        DELETE FROM voice_commands 
        WHERE timestamp < datetime('now', '-${days} days')
      `);
      stmt.run();
      
      console.log(`Dados de voz anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  async getApiDetails(apiId) {
    try {
      return voiceConfig.apis[apiId];
    } catch (error) {
      console.error('Erro ao obter detalhes da API:', error);
      throw error;
    }
  }

  async searchApiContent(apiId, query, limit = 20) {
    try {
      const ratings = await this.searchApi(apiId, query);
      return ratings.slice(0, limit);
    } catch (error) {
      console.error('Erro ao buscar conteúdo na API:', error);
      throw error;
    }
  }

  async getNewRatings(apiId = null, days = 7) {
    try {
      const ratings = await this.getNewRatings(apiId, days);
      return ratings;
    } catch (error) {
      console.error('Erro ao obter novos ratings:', error);
      throw error;
    }
  }

  async getPopularRatings(apiId = null, limit = 50) {
    try {
      const ratings = await this.getPopularRatings(apiId, limit);
      return ratings;
    } catch (error) {
      console.error('Erro ao obter ratings populares:', error);
      throw error;
    }
  }

  async getSimilarRatings(title, year, limit = 10) {
    try {
      const ratings = await this.getSimilarRatings(title, year, limit);
      return ratings;
    } catch (error) {
      console.error('Erro ao obter ratings similares:', error);
      throw error;
    }
  }

  // Métodos para integração com APIs de crítica
  async integrateWithIMDb(movieId, title, year) {
    try {
      // Aqui você implementaria a integração com IMDb
      console.log(`Integrando ${title} (${year}) com IMDb...`);
      return { success: true, message: 'Integração com IMDb concluída!' };
    } catch (error) {
      console.error('Erro ao integrar com IMDb:', error);
      throw error;
    }
  }

  async integrateWithRottenTomatoes(movieId, title, year) {
    try {
      // Aqui você implementaria a integração com Rotten Tomatoes
      console.log(`Integrando ${title} (${year}) com Rotten Tomatoes...`);
      return { success: true, message: 'Integração com Rotten Tomatoes concluída!' };
    } catch (error) {
      console.error('Erro ao integrar com Rotten Tomatoes:', error);
      throw error;
    }
  }

  async integrateWithLetterboxd(movieId, title, year) {
    try {
      // Aqui você implementaria a integração com Letterboxd
      console.log(`Integrando ${title} (${year}) com Letterboxd...`);
      return { success: true, message: 'Integração com Letterboxd concluída!' };
    } catch (error) {
      console.error('Erro ao integrar com Letterboxd:', error);
      throw error;
    }
  }

  async integrateWithFilmAffinity(movieId, title, year) {
    try {
      // Aqui você implementaria a integração com FilmAffinity
      console.log(`Integrando ${title} (${year}) com FilmAffinity...`);
      return { success: true, message: 'Integração com FilmAffinity concluída!' };
    } catch (error) {
      console.error('Erro ao integrar com FilmAffinity:', error);
      throw error;
    }
  }

  async integrateWithTrakt(movieId, title, year) {
    try {
      // Aqui você implementaria a integração com Trakt.tv
      console.log(`Integrando ${title} (${year}) com Trakt.tv...`);
      return { success: true, message: 'Integração com Trakt.tv concluída!' };
    } catch (error) {
      console.error('Erro ao integrar com Trakt.tv:', error);
      throw error;
    }
  }

  async integrateWithMetacritic(movieId, title, year) {
    try {
      // Aqui você implementaria a integração com Metacritic
      console.log(`Integrando ${title} (${year}) com Metacritic...`);
      return { success: true, message: 'Integração com Metacritic concluída!' };
    } catch (error) {
      console.error('Erro ao integrar com Metacritic:', error);
      throw error;
    }
  }

  async integrateWithTMDb(movieId, title, year) {
    try {
      // Aqui você implementaria a integração com TMDb
      console.log(`Integrando ${title} (${year}) com TMDb...`);
      return { success: true, message: 'Integração com TMDb concluída!' };
    } catch (error) {
      console.error('Erro ao integrar com TMDb:', error);
      throw error;
    }
  }

  async integrateWithAllCritics(movieId, title, year) {
    try {
      const results = {
        imdb: await this.integrateWithIMDb(movieId, title, year),
        rottenTomatoes: await this.integrateWithRottenTomatoes(movieId, title, year),
        letterboxd: await this.integrateWithLetterboxd(movieId, title, year),
        filmAffinity: await this.integrateWithFilmAffinity(movieId, title, year),
        trakt: await this.integrateWithTrakt(movieId, title, year),
        metacritic: await this.integrateWithMetacritic(movieId, title, year),
        tmdb: await this.integrateWithTMDb(movieId, title, year)
      };

      console.log(`Integração completa para ${title} (${year}):`, results);
      return results;

    } catch (error) {
      console.error('Erro ao integrar com todas as críticas:', error);
      throw error;
    }
  }

  async getCriticRatings(movieId, title, year) {
    try {
      // Obter ratings de todas as críticas
      const ratings = {
        imdb: await this.getIMDbRating(title, year),
        rottenTomatoes: await this.getRottenTomatoesRating(title, year),
        letterboxd: await this.getLetterboxdRating(title, year),
        filmAffinity: await this.getFilmAffinityRating(title, year),
        trakt: await this.getTraktRating(title, year),
        metacritic: await this.getMetacriticRating(title, year),
        tmdb: await this.getTMDbRating(title, year)
      };

      return ratings;

    } catch (error) {
      console.error('Erro ao obter ratings de crítica:', error);
      throw error;
    }
  }

  async getIMDbRating(title, year) {
    try {
      // Implementar busca no IMDb
      console.log(`Buscando rating do IMDb para ${title} (${year})...`);
      return { rating: 8.5, votes: 1000000, url: 'https://www.imdb.com/title/tt0000000/' };
    } catch (error) {
      console.error('Erro ao buscar rating do IMDb:', error);
      return null;
    }
  }

  async getRottenTomatoesRating(title, year) {
    try {
      // Implementar busca no Rotten Tomatoes
      console.log(`Buscando rating do Rotten Tomatoes para ${title} (${year})...`);
      return { critics_score: 90, audience_score: 85, url: 'https://www.rottentomatoes.com/m/movie_title' };
    } catch (error) {
      console.error('Erro ao buscar rating do Rotten Tomatoes:', error);
      return null;
    }
  }

  async getLetterboxdRating(title, year) {
    try {
      // Implementar busca no Letterboxd
      console.log(`Buscando rating do Letterboxd para ${title} (${year})...`);
      return { rating: 4.2, votes: 50000, url: 'https://letterboxd.com/film/movie-title/' };
    } catch (error) {
      console.error('Erro ao buscar rating do Letterboxd:', error);
      return null;
    }
  }

  async getFilmAffinityRating(title, year) {
    try {
      // Implementar busca no FilmAffinity
      console.log(`Buscando rating do FilmAffinity para ${title} (${year})...`);
      return { rating: 7.8, votes: 20000, url: 'https://www.filmaffinity.com/pt/film123456.html' };
    } catch (error) {
      console.error('Erro ao buscar rating do FilmAffinity:', error);
      return null;
    }
  }

  async getTraktRating(title, year) {
    try {
      // Implementar busca no Trakt.tv
      console.log(`Buscando rating do Trakt.tv para ${title} (${year})...`);
      return { rating: 8.7, votes: 150000, url: 'https://trakt.tv/movies/movie-title-1972' };
    } catch (error) {
      console.error('Erro ao buscar rating do Trakt.tv:', error);
      return null;
    }
  }

  async getMetacriticRating(title, year) {
    try {
      // Implementar busca no Metacritic
      console.log(`Buscando rating do Metacritic para ${title} (${year})...`);
      return { critics_score: 80, users_score: 7.5, url: 'https://www.metacritic.com/movie/movie-title' };
    } catch (error) {
      console.error('Erro ao buscar rating do Metacritic:', error);
      return null;
    }
  }

  async getTMDbRating(title, year) {
    try {
      // Implementar busca no TMDb
      console.log(`Buscando rating do TMDb para ${title} (${year})...`);
      return { rating: 8.2, votes: 80000, url: 'https://www.themoviedb.org/movie/123456' };
    } catch (error) {
      console.error('Erro ao buscar rating do TMDb:', error);
      return null;
    }
  }

  async updateAllCriticRatings() {
    try {
      console.log(`[${new Date().toISOString()}] Atualizando ratings de crítica para todos os filmes...`);

      // Obter todos os filmes
      const moviesStmt = db.prepare('SELECT * FROM movies');
      const movies = moviesStmt.all();

      const results = {
        total: movies.length,
        checked: 0,
        updated: 0,
        errors: 0
      };

      // Atualizar cada filme
      for (const movie of movies) {
        try {
          await this.getCriticRatings(movie.id, movie.title, movie.year);
          results.checked++;
          results.updated++;

          // Delay para evitar bloqueios
          await VoiceUtils.sleep(200);

        } catch (error) {
          console.error(`Erro ao atualizar ratings de "${movie.title}":`, error.message);
          results.errors++;
        }
      }

      console.log(`[${new Date().toISOString()}] Atualização de ratings de crítica concluída`);
      return results;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Erro na atualização em massa de ratings:`, error);
      throw error;
    }
  }

  async getCriticStatistics() {
    try {
      // Obter estatísticas de ratings de crítica
      const stmt = db.prepare(`
        SELECT 
          'imdb' as source,
          COUNT(*) as total_ratings,
          AVG(rating_imdb) as average_rating,
          MAX(rating_imdb) as max_rating,
          MIN(rating_imdb) as min_rating,
          MAX(updated_at) as last_update
        FROM movies
        WHERE rating_imdb > 0
        UNION ALL
        SELECT 
          'rotten_tomatoes' as source,
          COUNT(*) as total_ratings,
          AVG(rating_rottentomatoes) as average_rating,
          MAX(rating_rottentomatoes) as max_rating,
          MIN(rating_rottentomatoes) as min_rating,
          MAX(updated_at) as last_update
        FROM movies
        WHERE rating_rottentomatoes > 0
        UNION ALL
        SELECT 
          'letterboxd' as source,
          COUNT(*) as total_ratings,
          AVG(rating_letterboxd) as average_rating,
          MAX(rating_letterboxd) as max_rating,
          MIN(rating_letterboxd) as min_rating,
          MAX(updated_at) as last_update
        FROM movies
        WHERE rating_letterboxd > 0
        UNION ALL
        SELECT 
          'filmaffinity' as source,
          COUNT(*) as total_ratings,
          AVG(rating_filmaffinity) as average_rating,
          MAX(rating_filmaffinity) as max_rating,
          MIN(rating_filmaffinity) as min_rating,
          MAX(updated_at) as last_update
        FROM movies
        WHERE rating_filmaffinity > 0
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter estatísticas de crítica:', error);
      throw error;
    }
  }

  async getCriticHistory(days = 30) {
    try {
      // Obter histórico de ratings de crítica
      const stmt = db.prepare(`
        SELECT * FROM critic_ratings
        WHERE last_updated >= datetime('now', '-${days} days')
        ORDER BY last_updated DESC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter histórico de crítica:', error);
      throw error;
    }
  }

  async getCriticChanges(days = 7) {
    try {
      // Obter mudanças de ratings de crítica
      const stmt = db.prepare(`
        SELECT 
          title, year, api_source,
          rating_value as current_rating,
          LAG(rating_value) OVER (PARTITION BY title, year, api_source ORDER BY last_updated) as previous_rating,
          last_updated
        FROM critic_ratings
        WHERE last_updated >= datetime('now', '-${days} days')
        ORDER BY last_updated DESC
      `);
      const rows = stmt.all();

      // Filtrar apenas mudanças significativas
      const changes = rows.filter(row => 
        row.previous_rating && 
        Math.abs(row.current_rating - row.previous_rating) > 0.1
      );

      return changes;
    } catch (error) {
      console.error('Erro ao obter mudanças de crítica:', error);
      throw error;
    }
  }

  async getTopRatedMovies(limit = 10) {
    try {
      // Obter filmes melhor avaliados
      const stmt = db.prepare(`
        SELECT 
          title, year, rating_imdb, rating_rottentomatoes, rating_letterboxd,
          rating_filmaffinity, personal_rating
        FROM movies
        WHERE rating_imdb > 0 OR rating_rottentomatoes > 0 OR rating_letterboxd > 0
        ORDER BY 
          (COALESCE(rating_imdb, 0) + 
           COALESCE(rating_rottentomatoes, 0) + 
           COALESCE(rating_letterboxd, 0) + 
           COALESCE(rating_filmaffinity, 0)) / 4 DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter filmes melhor avaliados:', error);
      throw error;
    }
  }

  async getWorstRatedMovies(limit = 10) {
    try {
      // Obter filmes pior avaliados
      const stmt = db.prepare(`
        SELECT 
          title, year, rating_imdb, rating_rottentomatoes, rating_letterboxd,
          rating_filmaffinity, personal_rating
        FROM movies
        WHERE rating_imdb > 0 OR rating_rottentomatoes > 0 OR rating_letterboxd > 0
        ORDER BY 
          (COALESCE(rating_imdb, 10) + 
           COALESCE(rating_rottentomatoes, 100) + 
           COALESCE(rating_letterboxd, 5) + 
           COALESCE(rating_filmaffinity, 10)) / 4 ASC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter filmes pior avaliados:', error);
      throw error;
    }
  }

  async getRatingDistribution() {
    try {
      // Obter distribuição de ratings
      const stmt = db.prepare(`
        SELECT 
          'imdb' as source,
          CAST(FLOOR(rating_imdb) AS INTEGER) as rating_range,
          COUNT(*) as count
        FROM movies
        WHERE rating_imdb > 0
        GROUP BY rating_range
        UNION ALL
        SELECT 
          'rotten_tomatoes' as source,
          CAST(FLOOR(rating_rottentomatoes / 10) AS INTEGER) as rating_range,
          COUNT(*) as count
        FROM movies
        WHERE rating_rottentomatoes > 0
        GROUP BY rating_range
        UNION ALL
        SELECT 
          'letterboxd' as source,
          CAST(FLOOR(rating_letterboxd) AS INTEGER) as rating_range,
          COUNT(*) as count
        FROM movies
        WHERE rating_letterboxd > 0
        GROUP BY rating_range
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter distribuição de ratings:', error);
      throw error;
    }
  }

  async getRatingConsensus(title, year) {
    try {
      // Obter consenso de ratings
      const stmt = db.prepare(`
        SELECT 
          title, year,
          rating_imdb, rating_rottentomatoes, rating_letterboxd, rating_filmaffinity,
          personal_rating
        FROM movies
        WHERE title = ? AND year = ?
      `);
      const movie = stmt.get(title, year);

      if (!movie) {
        return null;
      }

      const validRatings = [
        movie.rating_imdb,
        movie.rating_rottentomatoes ? movie.rating_rottentomatoes / 10 : null,
        movie.rating_letterboxd,
        movie.rating_filmaffinity,
        movie.personal_rating
      ].filter(r => r && r > 0);

      if (validRatings.length === 0) {
        return null;
      }

      const sum = validRatings.reduce((acc, r) => acc + r, 0);
      const average = sum / validRatings.length;

      return {
        title: movie.title,
        year: movie.year,
        consensus_rating: parseFloat(average.toFixed(2)),
        sources_count: validRatings.length,
        highest_rating: Math.max(...validRatings),
        lowest_rating: Math.min(...validRatings),
        confidence: validRatings.length >= 3 ? 'high' : 'low'
      };

    } catch (error) {
      console.error('Erro ao obter consenso de ratings:', error);
      throw error;
    }
  }

  async getRatingRecommendations(userId, limit = 10) {
    try {
      // Obter recomendações baseadas em ratings
      const stmt = db.prepare(`
        SELECT 
          m.title, m.year, m.rating_imdb, m.rating_rottentomatoes, m.rating_letterboxd,
          m.rating_filmaffinity, m.personal_rating,
          COUNT(*) OVER (PARTITION BY m.title, m.year) as source_count,
          AVG(m.rating_imdb) OVER (PARTITION BY m.title, m.year) as avg_imdb_rating
        FROM movies m
        INNER JOIN user_movies um ON m.id = um.movie_id
        WHERE um.user_id = ? AND m.rating_imdb > 0
        ORDER BY m.rating_imdb DESC
        LIMIT ?
      `);
      return stmt.all(userId, limit);
    } catch (error) {
      console.error('Erro ao obter recomendações de ratings:', error);
      throw error;
    }
  }

  async getRatingAlerts(userId, threshold = 8.0) {
    try {
      // Obter alertas de ratings altos
      const stmt = db.prepare(`
        SELECT 
          m.title, m.year, m.rating_imdb, m.rating_rottentomatoes, m.rating_letterboxd,
          m.rating_filmaffinity, m.personal_rating
        FROM movies m
        INNER JOIN user_movies um ON m.id = um.movie_id
        WHERE um.user_id = ? AND m.rating_imdb >= ?
        ORDER BY m.rating_imdb DESC
      `);
      const movies = stmt.all(userId, threshold);

      const alerts = movies.map(movie => ({
        title: movie.title,
        year: movie.year,
        average_rating: movie.rating_imdb,
        sources_count: 1,
        type: 'high_rating',
        priority: 'high',
        message: `Filme com rating médio de ${movie.rating_imdb.toFixed(2)}!`
      }));

      return alerts;

    } catch (error) {
      console.error('Erro ao obter alertas de ratings:', error);
      throw error;
    }
  }

  async getRatingInsights(userId) {
    try {
      // Obter insights de ratings
      const stmt = db.prepare(`
        SELECT 
          m.rating_imdb, m.rating_rottentomatoes, m.rating_letterboxd,
          m.rating_filmaffinity, m.personal_rating,
          m.year, m.genres
        FROM movies m
        INNER JOIN user_movies um ON m.id = um.movie_id
        WHERE um.user_id = ? AND m.rating_imdb > 0
      `);
      const movies = stmt.all(userId);

      if (movies.length === 0) {
        return {
          total_ratings: 0,
          average_rating: 0,
          highest_rating: 0,
          lowest_rating: 0,
          sources_distribution: {},
          rating_distribution: {},
          trends: {}
        };
      }

      // Calcular estatísticas
      const validRatings = movies.filter(m => m.rating_imdb > 0);
      const sum = validRatings.reduce((acc, m) => acc + m.rating_imdb, 0);
      const average = validRatings.length > 0 ? sum / validRatings.length : 0;

      // Distribuição por fontes
      const sourcesDistribution = {
        imdb: validRatings.filter(m => m.rating_imdb > 0).length,
        rotten_tomatoes: validRatings.filter(m => m.rating_rottentomatoes > 0).length,
        letterboxd: validRatings.filter(m => m.rating_letterboxd > 0).length,
        filmaffinity: validRatings.filter(m => m.rating_filmaffinity > 0).length,
        personal: validRatings.filter(m => m.personal_rating > 0).length
      };

      // Distribuição por ranges de rating
      const ratingDistribution = {};
      validRatings.forEach(m => {
        const range = Math.floor(m.rating_imdb);
        ratingDistribution[range] = (ratingDistribution[range] || 0) + 1;
      });

      // Tendências (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRatings = validRatings.filter(m => 
        new Date(m.updated_at) >= thirtyDaysAgo
      );

      const oldRatings = validRatings.filter(m => 
        new Date(m.updated_at) < thirtyDaysAgo
      );

      const recentSum = recentRatings.reduce((acc, m) => acc + m.rating_imdb, 0);
      const recentAverage = recentRatings.length > 0 ? recentSum / recentRatings.length : 0;

      const oldSum = oldRatings.reduce((acc, m) => acc + m.rating_imdb, 0);
      const oldAverage = oldRatings.length > 0 ? oldSum / oldRatings.length : 0;

      const trend = recentAverage > oldAverage ? 'improving' : 
                   recentAverage < oldAverage ? 'declining' : 'stable';

      return {
        total_ratings: movies.length,
        valid_ratings: validRatings.length,
        average_rating: parseFloat(average.toFixed(2)),
        highest_rating: validRatings.length > 0 ? 
          Math.max(...validRatings.map(m => m.rating_imdb)) : 0,
        lowest_rating: validRatings.length > 0 ? 
          Math.min(...validRatings.map(m => m.rating_imdb)) : 0,
        sources_distribution: sourcesDistribution,
        rating_distribution: ratingDistribution,
        trends: {
          recent_average: parseFloat(recentAverage.toFixed(2)),
          old_average: parseFloat(oldAverage.toFixed(2)),
          trend: trend,
          improvement: parseFloat((recentAverage - oldAverage).toFixed(2))
        }
      };

    } catch (error) {
      console.error('Erro ao obter insights de ratings:', error);
      throw error;
    }
  }
}

module.exports = StreamingUtils;