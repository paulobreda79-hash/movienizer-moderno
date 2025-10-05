// scripts/simple-test.js
const http = require('http');

console.log('🔍 A verificar se o servidor MovieNizer está a correr...');

const options = {
    hostname: 'localhost',
    port: 3001, // Mesma porta usada no server.js
    path: '/api/health',
    method: 'GET',
    timeout: 5000 // 5 segundos
};

const req = http.request(options, (res) => {
    console.log(`✅ Servidor está a responder! Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('🎉 API está saudável e operacional.');
    }
    process.exit(0);
});

req.on('error', (err) => {
    console.log('❌ Servidor NÃO está a correr ou não respondeu corretamente!');
    console.log('💡 Dica: Executa primeiro `npm start` num outro terminal.');
    console.log(`📝 Erro: ${err.message}`);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Timeout - O servidor não respondeu dentro de 5 segundos.');
    console.log('💡 Verifica se a porta 3001 está livre e o servidor está ativo.');
    process.exit(1);
});

req.end();