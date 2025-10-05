// socialService.js

const socialConfig = require('../config/socialConfig');
const SocialUtils = require('../utils/socialUtils');
const db = require('../data/database/init');

class SocialService {
  static async initialize() {
    try {
      // Verificar compatibilidade
      const availableApis = await this.checkSocialAPIs();
      console.log('Redes sociais disponíveis:', availableApis);

      // Agendar tarefas automáticas
      await this.scheduleAutoTasks();

      console.log('Serviço de redes sociais inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar serviço de redes sociais:', error);
      throw error;
    }
  }

  static async checkSocialAPIs() {
    try {
      const apis = {};
      
      // Verificar APIs de redes sociais
      if (socialConfig.platforms.facebook.enabled) {
        apis.facebook = {
          name: 'Facebook',
          status: 'available',
          version: socialConfig.platforms.facebook.apiVersion
        };
      }

      if (socialConfig.platforms.twitter.enabled) {
        apis.twitter = {
          name: 'Twitter',
          status: 'available',
          version: '1.1'
        };
      }

      if (socialConfig.platforms.instagram.enabled) {
        apis.instagram = {
          name: 'Instagram',
          status: 'available',
          version: 'Graph API'
        };
      }

      if (socialConfig.platforms.linkedin.enabled) {
        apis.linkedin = {
          name: 'LinkedIn',
          status: 'available',
          version: 'v2'
        };
      }

      if (socialConfig.platforms.whatsapp.enabled) {
        apis.whatsapp = {
          name: 'WhatsApp',
          status: 'available',
          version: 'Web'
        };
      }

      if (socialConfig.platforms.telegram.enabled) {
        apis.telegram = {
          name: 'Telegram',
          status: 'available',
          version: 'Bot API'
        };
      }

      if (socialConfig.platforms.email.enabled) {
        apis.email = {
          name: 'Email',
          status: 'available',
          version: 'SMTP'
        };
      }

      if (socialConfig.platforms.sms.enabled) {
        apis.sms = {
          name: 'SMS',
          status: 'available',
          version: 'Web'
        };
      }

      return apis;
    } catch (error) {
      console.error('Erro ao verificar APIs de redes sociais:', error);
      throw error;
    }
  }

  static async shareContent(contentType, contentId, platform, options = {}) {
    try {
      // Gerar URL de compartilhamento
      const shareUrl = await this.generateShareUrl(contentType, contentId, platform, options);
      
      // Abrir janela de compartilhamento
      const popup = window.open(shareUrl, '_blank', 'width=600,height=400');
      
      // Monitorar fechamento da janela
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          this.handleShareComplete(contentType, contentId, platform, options);
        }
      }, 1000);

      // Notificar usuário
      if (socialConfig.notifications.shareStarted) {
        await SocialUtils.showVoiceFeedback(`Compartilhando ${contentType}...`, 'info');
      }

      return { success: true, url: shareUrl, platform: platform };

    } catch (error) {
      console.error('Erro ao compartilhar conteúdo:', error);
      throw error;
    }
  }

  static async generateShareUrl(contentType, contentId, platform, options = {}) {
    try {
      // Obter dados do conteúdo
      let content = {};
      switch (contentType) {
        case 'movie':
          content = await this.getMovie(contentId);
          break;
        case 'person':
          content = await this.getPerson(contentId);
          break;
        case 'list':
          content = await this.getList(contentId);
          break;
        case 'rating':
          content = await this.getRating(contentId);
          break;
        default:
          throw new Error(`Tipo de conteúdo não suportado: ${contentType}`);
      }

      // Gerar URL base
      let baseUrl = '';
      let template = '';

      switch (platform) {
        case 'facebook':
          baseUrl = socialConfig.platforms.facebook.shareUrl;
          template = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}&quote=${encodeURIComponent(content.title)}`;
          break;
        case 'twitter':
          baseUrl = socialConfig.platforms.twitter.shareUrl;
          template = `https://twitter.com/intent/tweet?url=${encodeURIComponent(content.url)}&text=${encodeURIComponent(content.title)} ${content.hashtags ? content.hashtags.join(' ') : ''}`;
          break;
        case 'instagram':
          baseUrl = socialConfig.platforms.instagram.shareUrl;
          template = `https://www.instagram.com/share?url=${encodeURIComponent(content.url)}`;
          break;
        case 'linkedin':
          baseUrl = socialConfig.platforms.linkedin.shareUrl;
          template = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(content.url)}&title=${encodeURIComponent(content.title)}&summary=${encodeURIComponent(content.description)}&source=MovieNizer`;
          break;
        case 'whatsapp':
          baseUrl = socialConfig.platforms.whatsapp.shareUrl;
          template = `https://api.whatsapp.com/send?text=${encodeURIComponent(content.title)}%20-%20${encodeURIComponent(content.url)}`;
          break;
        case 'telegram':
          baseUrl = socialConfig.platforms.telegram.shareUrl;
          template = `https://t.me/share/url?url=${encodeURIComponent(content.url)}&text=${encodeURIComponent(content.title)}`;
          break;
        case 'email':
          baseUrl = socialConfig.platforms.email.shareUrl;
          template = `mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(content.title)}%20-%20${encodeURIComponent(content.url)}%0A%0A${encodeURIComponent(content.description)}`;
          break;
        case 'sms':
          baseUrl = socialConfig.platforms.sms.shareUrl;
          template = `sms:?body=${encodeURIComponent(content.title)}%20-%20${encodeURIComponent(content.url)}`;
          break;
        default:
          throw new Error(`Plataforma não suportada: ${platform}`);
      }

      // Substituir placeholders
      const url = template
        .replace('{url}', encodeURIComponent(content.url))
        .replace('{title}', encodeURIComponent(content.title))
        .replace('{description}', encodeURIComponent(content.description || ''))
        .replace('{hashtags}', content.hashtags ? content.hashtags.join(' ') : '');

      return url;

    } catch (error) {
      console.error('Erro ao gerar URL de compartilhamento:', error);
      throw error;
    }
  }

  static async getMovie(movieId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM movies 
        WHERE id = ?
      `);
      return stmt.get(movieId);
    } catch (error) {
      console.error('Erro ao obter filme:', error);
      throw error;
    }
  }

  static async getPerson(personId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM people 
        WHERE id = ?
      `);
      return stmt.get(personId);
    } catch (error) {
      console.error('Erro ao obter pessoa:', error);
      throw error;
    }
  }

  static async getList(listId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM lists 
        WHERE id = ?
      `);
      return stmt.get(listId);
    } catch (error) {
      console.error('Erro ao obter lista:', error);
      throw error;
    }
  }

  static async getRating(ratingId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM ratings 
        WHERE id = ?
      `);
      return stmt.get(ratingId);
    } catch (error) {
      console.error('Erro ao obter rating:', error);
      throw error;
    }
  }

  static async handleShareComplete(contentType, contentId, platform, options = {}) {
    try {
      // Salvar registro de compartilhamento
      await this.saveShareRecord(contentType, contentId, platform, options);

      // Atualizar contadores
      await this.updateShareCounts(contentType, contentId, platform);

      // Notificar usuário
      if (socialConfig.notifications.shareCompleted) {
        await SocialUtils.showVoiceFeedback(`Compartilhamento concluído em ${platform}!`, 'success');
      }

      console.log(`Compartilhamento concluído: ${contentType} ${contentId} em ${platform}`);
    } catch (error) {
      console.error('Erro ao finalizar compartilhamento:', error);
    }
  }

  static async saveShareRecord(contentType, contentId, platform, options = {}) {
    try {
      const stmt = db.prepare(`
        INSERT INTO social_shares (
          content_type, content_id, platform, user_id, ip_address, user_agent,
          referrer, shared_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        contentType,
        contentId,
        platform,
        options.userId || 1, // Placeholder
        options.ipAddress || '127.0.0.1',
        options.userAgent || navigator.userAgent,
        options.referrer || document.referrer,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Erro ao salvar registro de compartilhamento:', error);
      throw error;
    }
  }

  static async updateShareCounts(contentType, contentId, platform) {
    try {
      // Atualizar contador geral
      const stmt = db.prepare(`
        UPDATE social_stats 
        SET total_shares = total_shares + 1,
            ${platform}_shares = ${platform}_shares + 1,
            last_shared_at = ?
        WHERE content_type = ? AND content_id = ?
      `);

      stmt.run(
        new Date().toISOString(),
        contentType,
        contentId
      );

      // Se não existir, criar registro
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO social_stats (
          content_type, content_id, total_shares, ${platform}_shares, last_shared_at, created_at, updated_at
        ) VALUES (?, ?, 1, 1, ?, ?, ?)
      `);

      insertStmt.run(
        contentType,
        contentId,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Erro ao atualizar contadores de compartilhamento:', error);
      throw error;
    }
  }

  static async getShareStats(contentType, contentId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM social_stats 
        WHERE content_type = ? AND content_id = ?
      `);
      return stmt.get(contentType, contentId);
    } catch (error) {
      console.error('Erro ao obter estatísticas de compartilhamento:', error);
      throw error;
    }
  }

  static async getTopSharedContent(limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT content_type, content_id, SUM(total_shares) as total_shares
        FROM social_stats
        GROUP BY content_type, content_id
        ORDER BY total_shares DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter conteúdo mais compartilhado:', error);
      throw error;
    }
  }

  static async getPlatformShareStats(platform, limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT content_type, content_id, ${platform}_shares as shares
        FROM social_stats
        WHERE ${platform}_shares > 0
        ORDER BY ${platform}_shares DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error(`Erro ao obter estatísticas de compartilhamento para ${platform}:`, error);
      throw error;
    }
  }

  static async getRecentShares(days = 7, limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM social_shares
        WHERE shared_at >= datetime('now', '-${days} days')
        ORDER BY shared_at DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter compartilhamentos recentes:', error);
      throw error;
    }
  }

  static async getEngagementStats(contentType, contentId) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM social_engagement
        WHERE content_type = ? AND content_id = ?
      `);
      return stmt.get(contentType, contentId);
    } catch (error) {
      console.error('Erro ao obter estatísticas de engajamento:', error);
      throw error;
    }
  }

  static async recordEngagement(contentType, contentId, engagementType, options = {}) {
    try {
      const stmt = db.prepare(`
        INSERT INTO social_engagement (
          content_type, content_id, engagement_type, user_id, ip_address, user_agent,
          referrer, engagement_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        contentType,
        contentId,
        engagementType,
        options.userId || 1, // Placeholder
        options.ipAddress || '127.0.0.1',
        options.userAgent || navigator.userAgent,
        options.referrer || document.referrer,
        JSON.stringify(options.engagementData || {}),
        new Date().toISOString(),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Erro ao registrar engajamento:', error);
      throw error;
    }
  }

  static async updateEngagementCounts(contentType, contentId, engagementType) {
    try {
      // Atualizar contador geral
      const stmt = db.prepare(`
        UPDATE social_engagement_stats 
        SET total_engagements = total_engagements + 1,
            ${engagementType}_engagements = ${engagementType}_engagements + 1,
            last_engaged_at = ?
        WHERE content_type = ? AND content_id = ?
      `);

      stmt.run(
        new Date().toISOString(),
        contentType,
        contentId
      );

      // Se não existir, criar registro
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO social_engagement_stats (
          content_type, content_id, total_engagements, ${engagementType}_engagements, last_engaged_at, created_at, updated_at
        ) VALUES (?, ?, 1, 1, ?, ?, ?)
      `);

      insertStmt.run(
        contentType,
        contentId,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Erro ao atualizar contadores de engajamento:', error);
      throw error;
    }
  }

  static async getTopEngagedContent(limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT content_type, content_id, SUM(total_engagements) as total_engagements
        FROM social_engagement_stats
        GROUP BY content_type, content_id
        ORDER BY total_engagements DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter conteúdo mais engajado:', error);
      throw error;
    }
  }

  static async getEngagementByType(engagementType, limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT content_type, content_id, ${engagementType}_engagements as engagements
        FROM social_engagement_stats
        WHERE ${engagementType}_engagements > 0
        ORDER BY ${engagementType}_engagements DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error(`Erro ao obter engajamento por tipo ${engagementType}:`, error);
      throw error;
    }
  }

  static async getRecentEngagements(days = 7, limit = 10) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM social_engagement
        WHERE created_at >= datetime('now', '-${days} days')
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Erro ao obter engajamentos recentes:', error);
      throw error;
    }
  }

  static async scheduleAutoTasks() {
    const cron = require('node-cron');
    
    if (!socialConfig.general.autoShare) {
      console.log('Compartilhamento automático desativado');
      return;
    }

    const schedule = socialConfig.schedule[socialConfig.general.shareFrequency];
    if (!schedule) {
      console.error('Agendamento inválido:', socialConfig.general.shareFrequency);
      return;
    }

    cron.schedule(schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Executando compartilhamento automático...`);
        await this.autoShareContent();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro no compartilhamento automático:`, error);
      }
    }, {
      timezone: 'America/Sao_Paulo'
    });

    console.log(`Compartilhamento automático agendado para executar ${socialConfig.general.shareFrequency}`);
  }

  static async autoShareContent() {
    try {
      // Obter conteúdo recomendado para compartilhamento
      const recommendedContent = await this.getRecommendedContentForSharing();
      
      // Compartilhar em plataformas configuradas
      for (const content of recommendedContent) {
        for (const platform of Object.keys(socialConfig.platforms)) {
          if (socialConfig.platforms[platform].enabled && socialConfig.sharing.includePlatform[platform]) {
            await this.shareContent(content.type, content.id, platform);
          }
        }
      }

      console.log('Compartilhamento automático concluído');
    } catch (error) {
      console.error('Erro no compartilhamento automático:', error);
      throw error;
    }
  }

  static async getRecommendedContentForSharing() {
    try {
      // Obter conteúdo com alta avaliação
      const stmt = db.prepare(`
        SELECT id, 'movie' as type, title, rating_imdb as score
        FROM movies
        WHERE rating_imdb > 8.0
        ORDER BY rating_imdb DESC
        LIMIT 5
      `);
      return stmt.all();
    } catch (error) {
      console.error('Erro ao obter conteúdo recomendado para compartilhamento:', error);
      throw error;
    }
  }

  static async cleanupOldData(days = 30) {
    try {
      // Limpar dados antigos de compartilhamento
      const stmt = db.prepare(`
        DELETE FROM social_shares 
        WHERE shared_at < datetime('now', '-${days} days')
      `);
      stmt.run();
      
      // Limpar dados antigos de engajamento
      const stmt2 = db.prepare(`
        DELETE FROM social_engagement 
        WHERE created_at < datetime('now', '-${days} days')
      `);
      stmt2.run();
      
      console.log(`Dados de compartilhamento anteriores a ${days} dias excluídos`);
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
      throw error;
    }
  }

  static async getApiDetails(apiId) {
    try {
      return socialConfig.apis[apiId];
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

module.exports = SocialService;