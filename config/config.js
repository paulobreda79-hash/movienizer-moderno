// config/config.js - Versão ESM (ES Modules)

// Carregar variáveis de ambiente
import 'dotenv/config';

// Configuração principal
const config = {
    tmdb: {
        apiKey: process.env.TMDB_API_KEY,
        baseURL: 'https://api.themoviedb.org/3',
        imageBaseURL: 'https://image.tmdb.org/t/p/w500'
    },
    database: {
        filename: './database/movienizer.db' // Caminho relativo para a base de dados
    },
    server: {
        port: parseInt(process.env.PORT) || 3001
    }
};

// Exportar como default
export default config;