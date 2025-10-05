// UserProfile.js

const db = require('../data/database/init');
const profileConfig = require('../config/profileConfig');

class UserProfile {
  static create(profileData) {
    const stmt = db.prepare(`
      INSERT INTO user_profiles (
        user_id, profile_name, profile_type, is_active,
        personal_info, preferences, privacy_settings,
        notification_settings, streaming_preferences, widget_settings,
        backup_settings, integration_settings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      profileData.user_id,
      profileData.profile_name || 'Perfil Principal',
      profileData.profile_type || 'main',
      profileData.is_active || 1,
      JSON.stringify(profileData.personal_info || {}),
      JSON.stringify(profileData.preferences || {}),
      JSON.stringify(profileData.privacy_settings || {}),
      JSON.stringify(profileData.notification_settings || {}),
      JSON.stringify(profileData.streaming_preferences || {}),
      JSON.stringify(profileData.widget_settings || {}),
      JSON.stringify(profileData.backup_settings || {}),
      JSON.stringify(profileData.integration_settings || {}),
      new Date().toISOString(),
      new Date().toISOString()
    );

    return { id: result.lastInsertRowid, ...profileData };
  }

  static findByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM user_profiles 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  }

  static findById(profileId) {
    const stmt = db.prepare('SELECT * FROM user_profiles WHERE id = ?');
    return stmt.get(profileId);
  }

  static findByUserIdAndType(userId, profileType) {
    const stmt = db.prepare(`
      SELECT * FROM user_profiles 
      WHERE user_id = ? AND profile_type = ?
    `);
    return stmt.get(userId, profileType);
  }

  static update(profileId, profileData) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        profile_name = ?,
        profile_type = ?,
        is_active = ?,
        personal_info = ?,
        preferences = ?,
        privacy_settings = ?,
        notification_settings = ?,
        streaming_preferences = ?,
        widget_settings = ?,
        backup_settings = ?,
        integration_settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      profileData.profile_name,
      profileData.profile_type,
      profileData.is_active || 0,
      JSON.stringify(profileData.personal_info || {}),
      JSON.stringify(profileData.preferences || {}),
      JSON.stringify(profileData.privacy_settings || {}),
      JSON.stringify(profileData.notification_settings || {}),
      JSON.stringify(profileData.streaming_preferences || {}),
      JSON.stringify(profileData.widget_settings || {}),
      JSON.stringify(profileData.backup_settings || {}),
      JSON.stringify(profileData.integration_settings || {}),
      profileId
    );
  }

  static delete(profileId) {
    const stmt = db.prepare('DELETE FROM user_profiles WHERE id = ?');
    stmt.run(profileId);
  }

  static activateProfile(profileId) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(profileId);
  }

  static deactivateProfile(profileId) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(profileId);
  }

  static getActiveProfile(userId) {
    const stmt = db.prepare(`
      SELECT * FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    return stmt.get(userId);
  }

  static getDefaultProfile(userId) {
    const stmt = db.prepare(`
      SELECT * FROM user_profiles 
      WHERE user_id = ? AND profile_type = 'main'
    `);
    return stmt.get(userId) || this.getActiveProfile(userId);
  }

  static getProfileStats(userId) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_profiles,
        COUNT(CASE WHEN profile_type = 'main' THEN 1 END) as main_profiles,
        MAX(created_at) as last_profile_created
      FROM user_profiles 
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  }

  static getProfileHistory(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT * FROM user_profiles 
      WHERE user_id = ? 
      ORDER BY updated_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  static getProfileChanges(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        id, profile_name, profile_type, updated_at,
        (julianday('now') - julianday(updated_at)) * 24 * 60 as minutes_since_update
      FROM user_profiles 
      WHERE user_id = ? 
      AND updated_at >= datetime('now', '-${days} days')
      ORDER BY updated_at DESC
    `);
    return stmt.all(userId);
  }

  static getProfileUsage(userId, days = 30) {
    const stmt = db.prepare(`
      SELECT 
        profile_type,
        COUNT(*) as usage_count,
        MAX(updated_at) as last_used
      FROM user_profiles 
      WHERE user_id = ? 
      AND updated_at >= datetime('now', '-${days} days')
      GROUP BY profile_type
      ORDER BY usage_count DESC
    `);
    return stmt.all(userId);
  }

  static getProfilePreferences(userId) {
    const stmt = db.prepare(`
      SELECT preferences FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    const result = stmt.get(userId);
    return result ? JSON.parse(result.preferences || '{}') : {};
  }

  static getProfilePrivacySettings(userId) {
    const stmt = db.prepare(`
      SELECT privacy_settings FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    const result = stmt.get(userId);
    return result ? JSON.parse(result.privacy_settings || '{}') : {};
  }

  static getProfileNotificationSettings(userId) {
    const stmt = db.prepare(`
      SELECT notification_settings FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    const result = stmt.get(userId);
    return result ? JSON.parse(result.notification_settings || '{}') : {};
  }

  static getProfileStreamingPreferences(userId) {
    const stmt = db.prepare(`
      SELECT streaming_preferences FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    const result = stmt.get(userId);
    return result ? JSON.parse(result.streaming_preferences || '{}') : {};
  }

  static getProfileWidgetSettings(userId) {
    const stmt = db.prepare(`
      SELECT widget_settings FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    const result = stmt.get(userId);
    return result ? JSON.parse(result.widget_settings || '{}') : {};
  }

  static getProfileBackupSettings(userId) {
    const stmt = db.prepare(`
      SELECT backup_settings FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    const result = stmt.get(userId);
    return result ? JSON.parse(result.backup_settings || '{}') : {};
  }

  static getProfileIntegrationSettings(userId) {
    const stmt = db.prepare(`
      SELECT integration_settings FROM user_profiles 
      WHERE user_id = ? AND is_active = 1
    `);
    const result = stmt.get(userId);
    return result ? JSON.parse(result.integration_settings || '{}') : {};
  }

  static updateProfilePreferences(userId, preferences) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        preferences = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `);
    stmt.run(JSON.stringify(preferences), userId);
  }

  static updateProfilePrivacySettings(userId, privacySettings) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        privacy_settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `);
    stmt.run(JSON.stringify(privacySettings), userId);
  }

  static updateProfileNotificationSettings(userId, notificationSettings) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        notification_settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `);
    stmt.run(JSON.stringify(notificationSettings), userId);
  }

  static updateProfileStreamingPreferences(userId, streamingPreferences) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        streaming_preferences = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `);
    stmt.run(JSON.stringify(streamingPreferences), userId);
  }

  static updateProfileWidgetSettings(userId, widgetSettings) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        widget_settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `);
    stmt.run(JSON.stringify(widgetSettings), userId);
  }

  static updateProfileBackupSettings(userId, backupSettings) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        backup_settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `);
    stmt.run(JSON.stringify(backupSettings), userId);
  }

  static updateProfileIntegrationSettings(userId, integrationSettings) {
    const stmt = db.prepare(`
      UPDATE user_profiles SET
        integration_settings = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `);
    stmt.run(JSON.stringify(integrationSettings), userId);
  }

  static validateProfileData(profileData) {
    const errors = [];

    // Validar nome completo
    if (profileData.personal_info && profileData.personal_info.fullName) {
      const fullName = profileData.personal_info.fullName;
      if (fullName.length < profileConfig.validation.fullName.minLength) {
        errors.push(`Nome completo deve ter pelo menos ${profileConfig.validation.fullName.minLength} caracteres`);
      }
      if (fullName.length > profileConfig.validation.fullName.maxLength) {
        errors.push(`Nome completo deve ter no máximo ${profileConfig.validation.fullName.maxLength} caracteres`);
      }
    }

    // Validar apelido
    if (profileData.personal_info && profileData.personal_info.nickname) {
      const nickname = profileData.personal_info.nickname;
      if (nickname.length < profileConfig.validation.nickname.minLength) {
        errors.push(`Apelido deve ter pelo menos ${profileConfig.validation.nickname.minLength} caracteres`);
      }
      if (nickname.length > profileConfig.validation.nickname.maxLength) {
        errors.push(`Apelido deve ter no máximo ${profileConfig.validation.nickname.maxLength} caracteres`);
      }
    }

    // Validar biografia
    if (profileData.personal_info && profileData.personal_info.bio) {
      const bio = profileData.personal_info.bio;
      if (bio.length > profileConfig.validation.bio.maxLength) {
        errors.push(`Biografia deve ter no máximo ${profileConfig.validation.bio.maxLength} caracteres`);
      }
    }

    // Validar data de nascimento
    if (profileData.personal_info && profileData.personal_info.birthDate) {
      const birthDate = profileData.personal_info.birthDate;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birthDate)) {
        errors.push('Data de nascimento deve estar no formato YYYY-MM-DD');
      }
    }

    // Validar local de nascimento
    if (profileData.personal_info && profileData.personal_info.birthPlace) {
      const birthPlace = profileData.personal_info.birthPlace;
      if (birthPlace.length > profileConfig.validation.birthPlace.maxLength) {
        errors.push(`Local de nascimento deve ter no máximo ${profileConfig.validation.birthPlace.maxLength} caracteres`);
      }
    }

    // Validar altura
    if (profileData.personal_info && profileData.personal_info.height) {
      const height = profileData.personal_info.height;
      const heightRegex = profileConfig.validation.height.pattern;
      if (!heightRegex.test(height)) {
        errors.push('Altura deve estar no formato numérico (ex: 1.75)');
      }
    }

    // Validar itens por página
    if (profileData.preferences && profileData.preferences.itemsPerPage) {
      const itemsPerPage = parseInt(profileData.preferences.itemsPerPage);
      if (itemsPerPage < profileConfig.validation.itemsPerPage.min) {
        errors.push(`Itens por página devem ser pelo menos ${profileConfig.validation.itemsPerPage.min}`);
      }
      if (itemsPerPage > profileConfig.validation.itemsPerPage.max) {
        errors.push(`Itens por página devem ser no máximo ${profileConfig.validation.itemsPerPage.max}`);
      }
    }

    // Validar retenção de backup
    if (profileData.backup_settings && profileData.backup_settings.backupRetention) {
      const backupRetention = parseInt(profileData.backup_settings.backupRetention);
      if (backupRetention < profileConfig.validation.backupRetention.min) {
        errors.push(`Retenção de backups deve ser pelo menos ${profileConfig.validation.backupRetention.min} dias`);
      }
      if (backupRetention > profileConfig.validation.backupRetention.max) {
        errors.push(`Retenção de backups deve ser no máximo ${profileConfig.validation.backupRetention.max} dias`);
      }
    }

    // Validar intervalo de atualização de widgets
    if (profileData.widget_settings && profileData.widget_settings.widgetRefreshInterval) {
      const widgetRefreshInterval = parseInt(profileData.widget_settings.widgetRefreshInterval);
      if (widgetRefreshInterval < profileConfig.validation.widgetRefreshInterval.min) {
        errors.push(`Intervalo de atualização de widgets deve ser pelo menos ${profileConfig.validation.widgetRefreshInterval.min} minutos`);
      }
      if (widgetRefreshInterval > profileConfig.validation.widgetRefreshInterval.max) {
        errors.push(`Intervalo de atualização de widgets deve ser no máximo ${profileConfig.validation.widgetRefreshInterval.max} minutos`);
      }
    }

    return errors;
  }

  static sanitizeProfileData(profileData) {
    const sanitized = { ...profileData };

    // Sanitizar texto
    if (sanitized.personal_info) {
      if (sanitized.personal_info.fullName) {
        sanitized.personal_info.fullName = sanitized.personal_info.fullName.trim();
      }
      if (sanitized.personal_info.nickname) {
        sanitized.personal_info.nickname = sanitized.personal_info.nickname.trim();
      }
      if (sanitized.personal_info.bio) {
        sanitized.personal_info.bio = sanitized.personal_info.bio.trim();
      }
      if (sanitized.personal_info.birthPlace) {
        sanitized.personal_info.birthPlace = sanitized.personal_info.birthPlace.trim();
      }
    }

    // Sanitizar números
    if (sanitized.preferences && sanitized.preferences.itemsPerPage) {
      sanitized.preferences.itemsPerPage = parseInt(sanitized.preferences.itemsPerPage);
    }

    if (sanitized.backup_settings && sanitized.backup_settings.backupRetention) {
      sanitized.backup_settings.backupRetention = parseInt(sanitized.backup_settings.backupRetention);
    }

    if (sanitized.widget_settings && sanitized.widget_settings.widgetRefreshInterval) {
      sanitized.widget_settings.widgetRefreshInterval = parseInt(sanitized.widget_settings.widgetRefreshInterval);
    }

    return sanitized;
  }

  static mergeProfiles(baseProfile, newProfile) {
    const merged = { ...baseProfile };

    // Mesclar informações pessoais
    if (newProfile.personal_info) {
      merged.personal_info = { ...merged.personal_info, ...newProfile.personal_info };
    }

    // Mesclar preferências
    if (newProfile.preferences) {
      merged.preferences = { ...merged.preferences, ...newProfile.preferences };
    }

    // Mesclar configurações de privacidade
    if (newProfile.privacy_settings) {
      merged.privacy_settings = { ...merged.privacy_settings, ...newProfile.privacy_settings };
    }

    // Mesclar configurações de notificação
    if (newProfile.notification_settings) {
      merged.notification_settings = { ...merged.notification_settings, ...newProfile.notification_settings };
    }

    // Mesclar preferências de streaming
    if (newProfile.streaming_preferences) {
      merged.streaming_preferences = { ...merged.streaming_preferences, ...newProfile.streaming_preferences };
    }

    // Mesclar configurações de widgets
    if (newProfile.widget_settings) {
      merged.widget_settings = { ...merged.widget_settings, ...newProfile.widget_settings };
    }

    // Mesclar configurações de backup
    if (newProfile.backup_settings) {
      merged.backup_settings = { ...merged.backup_settings, ...newProfile.backup_settings };
    }

    // Mesclar configurações de integração
    if (newProfile.integration_settings) {
      merged.integration_settings = { ...merged.integration_settings, ...newProfile.integration_settings };
    }

    return merged;
  }

  static cloneProfile(profileId, newProfileName) {
    const originalProfile = this.findById(profileId);
    if (!originalProfile) {
      throw new Error('Perfil original não encontrado');
    }

    const clonedProfile = {
      ...originalProfile,
      profile_name: newProfileName,
      profile_type: 'custom',
      is_active: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    delete clonedProfile.id;
    return this.create(clonedProfile);
  }

  static exportProfile(profileId) {
    const profile = this.findById(profileId);
    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    // Remover campos sensíveis
    const exportedProfile = {
      profile_name: profile.profile_name,
      profile_type: profile.profile_type,
      personal_info: JSON.parse(profile.personal_info || '{}'),
      preferences: JSON.parse(profile.preferences || '{}'),
      privacy_settings: JSON.parse(profile.privacy_settings || '{}'),
      notification_settings: JSON.parse(profile.notification_settings || '{}'),
      streaming_preferences: JSON.parse(profile.streaming_preferences || '{}'),
      widget_settings: JSON.parse(profile.widget_settings || '{}'),
      backup_settings: JSON.parse(profile.backup_settings || '{}'),
      integration_settings: JSON.parse(profile.integration_settings || '{}'),
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    return exportedProfile;
  }

  static importProfile(userId, profileData) {
    const importedProfile = {
      user_id: userId,
      profile_name: profileData.profile_name,
      profile_type: profileData.profile_type || 'imported',
      is_active: 0,
      personal_info: profileData.personal_info,
      preferences: profileData.preferences,
      privacy_settings: profileData.privacy_settings,
      notification_settings: profileData.notification_settings,
      streaming_preferences: profileData.streaming_preferences,
      widget_settings: profileData.widget_settings,
      backup_settings: profileData.backup_settings,
      integration_settings: profileData.integration_settings,
      created_at: profileData.created_at || new Date().toISOString(),
      updated_at: profileData.updated_at || new Date().toISOString()
    };

    return this.create(importedProfile);
  }

  static resetProfileToDefaults(profileId) {
    const profile = this.findById(profileId);
    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    const defaultProfile = {
      profile_name: profile.profile_name,
      profile_type: profile.profile_type,
      is_active: profile.is_active,
      personal_info: {},
      preferences: {},
      privacy_settings: {},
      notification_settings: {},
      streaming_preferences: {},
      widget_settings: {},
      backup_settings: {},
      integration_settings: {},
      updated_at: new Date().toISOString()
    };

    this.update(profileId, defaultProfile);
    return defaultProfile;
  }

  static getProfileTemplates() {
    return [
      {
        id: 'minimalist',
        name: 'Minimalista',
        description: 'Configurações básicas e limpas',
        preferences: {
          theme: 'light',
          fontSize: 'medium',
          layout: 'compact',
          defaultView: 'list',
          sortBy: 'title',
          sortOrder: 'asc',
          itemsPerPage: 20
        },
        privacy_settings: {
          profileVisibility: 'private',
          activityVisibility: 'private',
          watchlistVisibility: 'private',
          favoritesVisibility: 'private',
          ratingsVisibility: 'private'
        },
        notification_settings: {
          emailNotifications: false,
          pushNotifications: false,
          desktopNotifications: true,
          newMovieNotifications: false,
          newPersonNotifications: false,
          streamingAvailabilityNotifications: false,
          recommendationNotifications: false
        }
      },
      {
        id: 'power-user',
        name: 'Usuário Avançado',
        description: 'Todas as funcionalidades ativadas',
        preferences: {
          theme: 'dark',
          fontSize: 'large',
          layout: 'spacious',
          defaultView: 'grid',
          sortBy: 'rating',
          sortOrder: 'desc',
          itemsPerPage: 50
        },
        privacy_settings: {
          profileVisibility: 'public',
          activityVisibility: 'public',
          watchlistVisibility: 'friends',
          favoritesVisibility: 'friends',
          ratingsVisibility: 'public'
        },
        notification_settings: {
          emailNotifications: true,
          pushNotifications: true,
          desktopNotifications: true,
          newMovieNotifications: true,
          newPersonNotifications: true,
          streamingAvailabilityNotifications: true,
          recommendationNotifications: true
        },
        streaming_preferences: {
          preferredPlatforms: ['netflix', 'disney', 'prime', 'apple', 'hbo'],
          autoCheckStreaming: true,
          notifyStreamingChanges: true,
          streamingRegion: 'BR',
          maxStreamingResults: 20
        },
        widget_settings: {
          favoriteWidgets: ['movie-stats', 'person-stats', 'streaming-availability', 'recommendations', 'recently-added', 'top-rated'],
          defaultDashboardLayout: 'grid',
          dashboardColumns: 6,
          autoRefreshWidgets: true,
          widgetRefreshInterval: 2
        },
        backup_settings: {
          autoBackupEnabled: true,
          backupFrequency: 'daily',
          backupRetention: 90,
          cloudBackupEnabled: true,
          cloudProvider: 'aws',
          encryptBackups: true,
          compressBackups: true
        },
        integration_settings: {
          imdbIntegration: true,
          tmdbIntegration: true,
          rottenTomatoesIntegration: true,
          letterboxdIntegration: true,
          adorocinemaIntegration: true,
          traktIntegration: true,
          justwatchIntegration: true,
          syncWithSocialMedia: true
        }
      },
      {
        id: 'social',
        name: 'Social',
        description: 'Focado em compartilhamento e comunidade',
        preferences: {
          theme: 'light',
          fontSize: 'medium',
          layout: 'comfortable',
          defaultView: 'grid',
          sortBy: 'date_added',
          sortOrder: 'desc',
          itemsPerPage: 30
        },
        privacy_settings: {
          profileVisibility: 'public',
          activityVisibility: 'public',
          watchlistVisibility: 'friends',
          favoritesVisibility: 'friends',
          ratingsVisibility: 'public',
          allowMessaging: true,
          allowFollowing: true,
          showOnlineStatus: true
        },
        notification_settings: {
          emailNotifications: true,
          pushNotifications: true,
          desktopNotifications: true,
          newMovieNotifications: true,
          newPersonNotifications: true,
          streamingAvailabilityNotifications: true,
          recommendationNotifications: true,
          reminderNotifications: true,
          newsletterNotifications: true
        },
        streaming_preferences: {
          preferredPlatforms: ['netflix', 'disney', 'prime', 'apple', 'hbo', 'hulu'],
          autoCheckStreaming: true,
          notifyStreamingChanges: true,
          streamingRegion: 'BR',
          maxStreamingResults: 15
        },
        widget_settings: {
          favoriteWidgets: ['recently-added', 'recommendations', 'streaming-availability', 'top-rated'],
          defaultDashboardLayout: 'flex',
          dashboardColumns: 4,
          autoRefreshWidgets: true,
          widgetRefreshInterval: 5
        }
      },
      {
        id: 'privacy-focused',
        name: 'Foco em Privacidade',
        description: 'Configurações voltadas para privacidade máxima',
        preferences: {
          theme: 'dark',
          fontSize: 'medium',
          layout: 'compact',
          defaultView: 'list',
          sortBy: 'title',
          sortOrder: 'asc',
          itemsPerPage: 25
        },
        privacy_settings: {
          profileVisibility: 'private',
          activityVisibility: 'private',
          watchlistVisibility: 'private',
          favoritesVisibility: 'private',
          ratingsVisibility: 'private',
          allowMessaging: false,
          allowFollowing: false,
          showOnlineStatus: false
        },
        notification_settings: {
          emailNotifications: false,
          pushNotifications: false,
          desktopNotifications: false,
          newMovieNotifications: false,
          newPersonNotifications: false,
          streamingAvailabilityNotifications: false,
          recommendationNotifications: false,
          reminderNotifications: false,
          newsletterNotifications: false
        },
        streaming_preferences: {
          preferredPlatforms: [],
          autoCheckStreaming: false,
          notifyStreamingChanges: false,
          streamingRegion: 'BR',
          maxStreamingResults: 5
        },
        widget_settings: {
          favoriteWidgets: ['movie-stats', 'person-stats'],
          defaultDashboardLayout: 'grid',
          dashboardColumns: 3,
          autoRefreshWidgets: false,
          widgetRefreshInterval: 10
        },
        backup_settings: {
          autoBackupEnabled: true,
          backupFrequency: 'weekly',
          backupRetention: 30,
          cloudBackupEnabled: false,
          encryptBackups: true,
          compressBackups: true
        },
        integration_settings: {
          imdbIntegration: false,
          tmdbIntegration: false,
          rottenTomatoesIntegration: false,
          letterboxdIntegration: false,
          adorocinemaIntegration: false,
          traktIntegration: false,
          justwatchIntegration: false,
          syncWithSocialMedia: false
        }
      }
    ];
  }

  static applyProfileTemplate(userId, templateId) {
    const templates = this.getProfileTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error('Template de perfil não encontrado');
    }

    const profileData = {
      user_id: userId,
      profile_name: template.name,
      profile_type: 'template',
      is_active: 1,
      personal_info: {},
      preferences: template.preferences,
      privacy_settings: template.privacy_settings,
      notification_settings: template.notification_settings,
      streaming_preferences: template.streaming_preferences || {},
      widget_settings: template.widget_settings || {},
      backup_settings: template.backup_settings || {},
      integration_settings: template.integration_settings || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return this.create(profileData);
  }

  static getProfileRecommendations(userId) {
    const profile = this.getDefaultProfile(userId);
    if (!profile) return [];

    const preferences = JSON.parse(profile.preferences || '{}');
    const streaming = JSON.parse(profile.streaming_preferences || '{}');

    const recommendations = [];

    // Recomendar baseado nas preferências
    if (preferences.theme === 'light') {
      recommendations.push({
        type: 'theme',
        title: 'Tema Escuro',
        message: 'Experimente o tema escuro para reduzir cansaço visual',
        action: 'switch_theme',
        priority: 'medium'
      });
    }

    if (preferences.itemsPerPage && preferences.itemsPerPage < 20) {
      recommendations.push({
        type: 'performance',
        title: 'Itens por Página',
        message: 'Aumente o número de itens por página para melhor experiência',
        action: 'increase_items_per_page',
        priority: 'low'
      });
    }

    if (streaming.preferredPlatforms && streaming.preferredPlatforms.length === 0) {
      recommendations.push({
        type: 'streaming',
        title: 'Plataformas de Streaming',
        message: 'Configure suas plataformas preferidas para melhor filtragem',
        action: 'setup_streaming_platforms',
        priority: 'high'
      });
    }

    if (!streaming.autoCheckStreaming) {
      recommendations.push({
        type: 'streaming',
        title: 'Verificação Automática',
        message: 'Ative a verificação automática de streaming para ficar atualizado',
        action: 'enable_auto_streaming_check',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  static getProfileInsights(userId) {
    const profile = this.getDefaultProfile(userId);
    if (!profile) return {};

    const preferences = JSON.parse(profile.preferences || '{}');
    const privacy = JSON.parse(profile.privacy_settings || '{}');
    const notifications = JSON.parse(profile.notification_settings || '{}');
    const streaming = JSON.parse(profile.streaming_preferences || '{}');

    const insights = {
      preferences: {
        theme: preferences.theme || 'light',
        fontSize: preferences.fontSize || 'medium',
        layout: preferences.layout || 'comfortable',
        defaultView: preferences.defaultView || 'grid'
      },
      privacy: {
        visibilityLevel: privacy.profileVisibility || 'public',
        messagingEnabled: privacy.allowMessaging !== false,
        followingEnabled: privacy.allowFollowing !== false
      },
      notifications: {
        emailEnabled: notifications.emailNotifications !== false,
        pushEnabled: notifications.pushNotifications !== false,
        desktopEnabled: notifications.desktopNotifications !== false,
        totalEnabled: Object.values(notifications).filter(Boolean).length
      },
      streaming: {
        platformsConfigured: streaming.preferredPlatforms ? streaming.preferredPlatforms.length : 0,
        autoCheckEnabled: streaming.autoCheckStreaming !== false,
        notificationsEnabled: streaming.notifyStreamingChanges !== false
      },
      overallScore: 0
    };

    // Calcular pontuação geral
    let score = 0;
    let total = 0;

    // Preferências (20%)
    if (insights.preferences.theme !== 'light') score += 5;
    if (insights.preferences.fontSize !== 'small') score += 5;
    if (insights.preferences.layout !== 'compact') score += 5;
    if (insights.preferences.defaultView !== 'list') score += 5;
    total += 20;

    // Privacidade (20%)
    if (insights.privacy.visibilityLevel !== 'public') score += 10;
    if (!insights.privacy.messagingEnabled) score += 5;
    if (!insights.privacy.followingEnabled) score += 5;
    total += 20;

    // Notificações (20%)
    if (insights.notifications.emailEnabled) score += 5;
    if (insights.notifications.pushEnabled) score += 5;
    if (insights.notifications.desktopEnabled) score += 5;
    if (insights.notifications.totalEnabled >= 3) score += 5;
    total += 20;

    // Streaming (20%)
    if (insights.streaming.platformsConfigured > 0) score += 10;
    if (insights.streaming.autoCheckEnabled) score += 5;
    if (insights.streaming.notificationsEnabled) score += 5;
    total += 20;

    // Geral (20%)
    score += 20; // Pontuação base
    total += 20;

    insights.overallScore = Math.round((score / total) * 100);

    return insights;
  }
}

module.exports = StreamingUtils;