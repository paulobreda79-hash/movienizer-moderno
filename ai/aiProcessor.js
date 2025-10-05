// ai/aiProcessor.js
// Script para gerar descrições/resumos de todos os filmes (pode ser agendado por cron)

const aiController = require('./aiController');
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'database', 'movienizer.db');
const db = new Database(dbPath);

function getAllMovies() {
  return db.prepare('SELECT id FROM movies').all();
}

async function processAllMovies() {
  const movies = getAllMovies();
  console.log(`A processar IA para ${movies.length} filmes...`);
  for (const { id } of movies) {
    try {
      const aiData = await aiController.analyzeMovie(id);
      console.log(`✔️ ${id} - IA gerada com sucesso.`);
      // Opcional: gravar na BD (se tiveres campos description_ai, analysis_ai, summary_ai)
      db.prepare(`UPDATE movies SET 
        description_ai = ?, analysis_ai = ?, summary_ai = ? WHERE id = ?`
      ).run(aiData.description, aiData.analysis, aiData.summary, id);
    } catch (err) {
      console.error(`Erro no filme ${id}:`, err.message);
    }
  }
  console.log('Processamento IA concluído.');
}

if (require.main === module) {
  processAllMovies();
}
