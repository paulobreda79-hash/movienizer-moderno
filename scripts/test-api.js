// scripts/test-api.js
const axios = require('axios');
const BASE_URL = 'http://localhost:3001';

async function testAPI() {
    console.log('🧪 Testando MovieNizer API...');

    try {
        // Teste de saúde
        console.log('1. 🔍 Testando saúde da API...');
        const health = await axios.get(`${BASE_URL}/api/health`);
        console.log(' ✅ Saúde:', health.data.status);

        // Teste watchlist
        console.log('2. 📋 Testando watchlist...');
        const watchlist = await axios.get(`${BASE_URL}/api/watchlist`);
        console.log(' ✅ Watchlist:', watchlist.data.total, 'itens');

        // Teste coleção
        console.log('3. 📚 Testando coleção...');
        const collection = await axios.get(`${BASE_URL}/api/collection`);
        console.log(' ✅ Coleção:', collection.data.total, 'itens');

        // Teste streaming
        console.log('4. 📺 Testando streaming...');
        const streaming = await axios.get(`${BASE_URL}/api/streaming/availability/603`);
        console.log(' ✅ Streaming:', streaming.data.available_on.length, 'serviços');

        // Teste filmes
        console.log('5. 🎬 Testando busca de filmes...');
        const movies = await axios.get(`${BASE_URL}/api/movies/search?q=matrix`);
        console.log(' ✅ Filmes:', movies.data.results.length, 'resultados');

        console.log('🎉 Todos os testes passaram!');
    } catch (error) {
        console.log('❌ Erro nos testes:', error.message);
    }
}

testAPI();