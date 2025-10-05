// config/aiConfig.js
// Configuração para o módulo de IA textual

module.exports = {
  MODEL: 'qwen-js',                // ou 'gpt', 'local-llm', etc.
  MAX_TOKENS: 512,
  TEMPERATURE: 0.7,
  LANGUAGE: 'pt-PT',
  CACHE_TTL_HOURS: 48,             // guardar respostas durante 2 dias
  ENABLE_SUMMARY: true,
  ENABLE_DESCRIPTION: true,
  ENABLE_ANALYSIS: true
};
