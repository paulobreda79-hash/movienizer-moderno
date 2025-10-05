// scripts/clean-cache.js
const { cleanupOldCache } = require('../models/RecommendationCache');

console.log('🧹 A limpar cache de IA antiga...');
cleanupOldCache();
console.log('✅ Limpeza concluída.');
