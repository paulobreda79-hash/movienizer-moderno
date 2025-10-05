// src/context/AppContext.js

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('pt-BR');
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [notificationCount, setNotificationCount] = useState(0);
  const [tagFilter, setTagFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Carregar usuário
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      // Carregar preferências
      const darkModePref = await AsyncStorage.getItem('darkMode');
      if (darkModePref !== null) {
        setDarkMode(darkModePref === 'true');
      }

      const languagePref = await AsyncStorage.getItem('language');
      if (languagePref) {
        setLanguage(languagePref);
      }

      const offlineModePref = await AsyncStorage.getItem('offlineMode');
      if (offlineModePref !== null) {
        setOfflineMode(offlineModePref === 'true');
      }

      // Verificar conexão
      checkConnection();

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
      const isOnline = response.ok || response.type === 'opaque';
      
      if (!isOnline && !offlineMode) {
        setOfflineMode(true);
        setSyncStatus('offline');
      } else if (isOnline && offlineMode) {
        setOfflineMode(false);
        setSyncStatus('online');
      }
    } catch {
      setOfflineMode(true);
      setSyncStatus('offline');
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    await AsyncStorage.setItem('darkMode', newDarkMode.toString());
  };

  const changeLanguage = async (newLanguage) => {
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
  };

  const toggleOfflineMode = async () => {
    const newOfflineMode = !offlineMode;
    setOfflineMode(newOfflineMode);
    await AsyncStorage.setItem('offlineMode', newOfflineMode.toString());
    
    if (newOfflineMode) {
      setSyncStatus('offline');
    } else {
      setSyncStatus('syncing');
      // Iniciar sincronização
      syncData();
    }
  };

  const syncData = async () => {
    setSyncStatus('syncing');
    try {
      // Aqui você implementaria a lógica de sincronização
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulação
      setSyncStatus('synced');
    } catch (error) {
      setSyncStatus('error');
      console.error('Erro na sincronização:', error);
    }
  };

  const addNotification = async (notification) => {
    try {
      // Salvar notificação
      const notifications = await AsyncStorage.getItem('notifications') || '[]';
      const notificationList = JSON.parse(notifications);
      notificationList.push({
        ...notification,
        id: Date.now(),
        read: false,
        createdAt: new Date().toISOString()
      });
      
      await AsyncStorage.setItem('notifications', JSON.stringify(notificationList));
      setNotificationCount(notificationList.length);
    } catch (error) {
      console.error('Erro ao adicionar notificação:', error);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const notifications = await AsyncStorage.getItem('notifications') || '[]';
      const notificationList = JSON.parse(notifications);
      const updatedList = notificationList.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedList));
      setNotificationCount(updatedList.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      await AsyncStorage.removeItem('notifications');
      setNotificationCount(0);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    language,
    setLanguage,
    changeLanguage,
    offlineMode,
    setOfflineMode,
    toggleOfflineMode,
    syncStatus,
    setSyncStatus,
    notificationCount,
    setNotificationCount,
    tagFilter,
    setTagFilter,
    searchQuery,
    setSearchQuery,
    addNotification,
    markNotificationAsRead,
    clearNotifications,
    syncData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext, AppProvider };