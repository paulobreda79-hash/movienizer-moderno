// scripts/reset-db.js
const { initializeDatabase } = require('../database/init');

// Resetar o banco de dados
initializeDatabase();

console.log('✅ Banco de dados resetado com sucesso!');