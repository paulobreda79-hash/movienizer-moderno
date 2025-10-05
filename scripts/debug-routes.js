// scripts/debug-routes.js
const axios = require('axios');
const BASE_URL = 'http://localhost:3001';

async function debugRoutes() {
    try {
        console.log('🔍 A obter rotas registradas...');
        const response = await axios.get(`${BASE_URL}/api/debug/routes`);
        console.log('✅ Rotas:', response.data.routes);
    } catch (error) {
        console.error('❌ Erro ao obter rotas:', error.message);
    }
}

debugRoutes();