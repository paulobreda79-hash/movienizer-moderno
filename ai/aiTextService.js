// ai/aiTextService.js
// Serviço de IA integrado com modelo Qwen (API REST local ou script Node)
// Autor: Paulo Santos © 2025

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Certifica-te que tens instalado: npm install node-fetch
const config = require('../config/aiConfig');
const promptsPath = path.join(__dirname, 'prompts');

// ===============================
// 🔧 CONFIGURAÇÃO DO MODELO QWEN
// ===============================
const QWEN_API = process.env.QWEN_API || 'http://localhost:11434/api/generate';
const QWEN_MODEL = config.MODEL || 'qwen:latest';
const HEADERS = { 'Content-Type': 'application/json' };

// ===============================
// ⚙️ Função principal de geração
// ===============================
async function generateText(promptBase, variables = {}) {
  let prompt = promptBase;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }

  try {
    // Envio do pedido ao modelo Qwen
    const response = await fetch(QWEN_API, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        model: QWEN_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: config.TEMPERATURE,
          max_tokens: config.MAX_TOKENS
        }
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Erro na resposta Qwen (${response.status}): ${txt}`);
    }

    const data = await response.json();

    // Caso o formato devolvido pelo Qwen use { response: "...texto..." }
    const output = data.response || data.text || JSON.stringify(data);
    return output.trim();

  } catch (err) {
    console.error('[IA] Erro ao gerar texto:', err.message);
    return `[IA: erro ao gerar texto] ${err.message}`;
  }
}

// ===============================
// 🧩 Geração de tipos específicos
// ===============================

async function generateDescription(movie) {
  const prompt = fs.readFileSync(path.join(promptsPath, 'descriptionPrompt.txt'), 'utf8');
  return await generateText(prompt, {
    title: movie.title,
    genre: (movie.genres || []).join(', '),
    director: (movie.director || []).join(', '),
    plot: movie.plot || ''
  });
}

async function generateAnalysis(movie) {
  const prompt = fs.readFileSync(path.join(promptsPath, 'analysisPrompt.txt'), 'utf8');
  return await generateText(prompt, {
    title: movie.title,
    rating: movie.imdb_rating || '',
    reviews: (movie.reviews || []).join(' | ')
  });
}

async function generateSummary(movie) {
  const prompt = fs.readFileSync(path.join(promptsPath, 'summaryPrompt.txt'), 'utf8');
  return await generateText(prompt, {
    title: movie.title,
    description: movie.description || ''
  });
}

module.exports = {
  generateText,
  generateDescription,
  generateAnalysis,
  generateSummary
};
