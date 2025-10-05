// ai/qwen.js
// Execução local de Qwen via child_process (usando CLI Ollama, por exemplo)
const { spawnSync } = require('child_process');

function runQwen(prompt, model = 'qwen:latest') {
  try {
    const result = spawnSync('ollama', ['run', model, prompt], { encoding: 'utf8' });
    if (result.error) throw result.error;
    return result.stdout.trim();
  } catch (err) {
    console.error('[Qwen.js] Erro:', err.message);
    return `[Erro Qwen CLI] ${err.message}`;
  }
}

module.exports = { runQwen };
