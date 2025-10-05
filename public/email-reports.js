// email-reports.js

document.addEventListener('DOMContentLoaded', () => {
  let movies = [];
  let people = [];

  // Carregar dados
  loadEmailData();

  // Eventos
  document.getElementById('btn-preview').addEventListener('click', previewEmail);
  document.getElementById('btn-send').addEventListener('click', sendEmail);
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);

  // Eventos de filtros
  document.querySelectorAll('.filter-group select').forEach(select => {
    select.addEventListener('change', loadEmailData);
  });
});

// Função para carregar dados para e-mail
async function loadEmailData() {
  try {
    // Carregar filmes e pessoas
    const [moviesResponse, peopleResponse] = await Promise.all([
      fetch('/api/movies'),
      fetch('/api/people')
    ]);

    if (!moviesResponse.ok || !peopleResponse.ok) {
      throw new Error('Erro ao carregar dados');
    }

    movies = await moviesResponse.json();
    people = await peopleResponse.json();

  } catch (error) {
    console.error('Erro ao carregar dados para e-mail:', error);
    alert('Erro ao carregar dados para e-mail.');
  }
}

// Função para pré-visualizar o e-mail
function previewEmail() {
  const to = document.getElementById('email-to').value;
  const subject = document.getElementById('email-subject').value;
  const body = document.getElementById('email-body').value;

  document.getElementById('preview-to').textContent = to;
  document.getElementById('preview-subject').textContent = subject;
  document.getElementById('preview-body-text').textContent = body;

  // Anexos
  const attachmentsList = document.getElementById('preview-attachments-list');
  attachmentsList.innerHTML = '';
  if (document.getElementById('attach-pdf').checked) {
    const li = document.createElement('li');
    li.textContent = 'Relatório em PDF';
    attachmentsList.appendChild(li);
  }
  if (document.getElementById('attach-json').checked) {
    const li = document.createElement('li');
    li.textContent = 'Dados em JSON';
    attachmentsList.appendChild(li);
  }
  if (document.getElementById('attach-images').checked) {
    const li = document.createElement('li');
    li.textContent = 'Imagens dos pôsteres';
    attachmentsList.appendChild(li);
  }

  document.getElementById('preview-section').style.display = 'block';
}

// Função para enviar o e-mail
async function sendEmail() {
  const to = document.getElementById('email-to').value;
  const subject = document.getElementById('email-subject').value;
  const body = document.getElementById('email-body').value;
  const attachPdf = document.getElementById('attach-pdf').checked;
  const attachJson = document.getElementById('attach-json').checked;
  const attachImages = document.getElementById('attach-images').checked;

  if (!to) {
    alert("Por favor, informe um e-mail de destino.");
    return;
  }

  // Gerar PDF (opcional)
  if (attachPdf) {
    await generatePDF();
  }

  // Gerar JSON (opcional)
  if (attachJson) {
    const dataStr = JSON.stringify(movies, null, 2);
    const dataUri = 'application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'dados-filmes.json');
    linkElement.click();
  }

  // Simular envio de e-mail
  alert(`E-mail enviado para: ${to}\nAssunto: ${subject}\nAnexos: ${attachPdf ? 'PDF, ' : ''}${attachJson ? 'JSON, ' : ''}${attachImages ? 'Imagens' : ''}`.trim());

  // Abrir modal de confirmação
  document.getElementById('sent-emails-list').innerHTML = '';
  to.split(',').forEach(email => {
    const li = document.createElement('li');
    li.textContent = email.trim();
    document.getElementById('sent-emails-list').appendChild(li);
  });

  document.getElementById('confirmation-modal').style.display = 'flex';
}

// Função para gerar PDF
async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  const margin = 10;

  // Título
  doc.setFontSize(20);
  doc.text('Relatório de Estatísticas - MovieNizer', pageWidth / 2, 20, { align: 'center' });

  // Data
  const today = new Date();
  doc.setFontSize(12);
  doc.text(`Data: ${today.toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

  // Resumo
  doc.setFontSize(14);
  doc.text('Resumo Geral', margin, 45);
  doc.setFontSize(12);
  doc.text(`Total de Filmes: ${movies.length}`, margin, 55);
  const avgRating = (movies.reduce((sum, movie) => sum + (movie.rating_imdb || 0), 0) / movies.length).toFixed(2);
  doc.text(`Média de Rating: ${avgRating}`, margin, 60);
  const watchedCount = movies.filter(m => m.watched).length;
  doc.text(`Filmes Vistos: ${watchedCount}`, margin, 65);

  // Top 10 Filmes
  let yPos = 75;
  doc.text('Top 10 Melhores Filmes', margin, yPos);
  yPos += 10;

  const sortedMovies = [...movies].sort((a, b) => (b.rating_imdb || 0) - (a.rating_imdb || 0)).slice(0, 10);
  sortedMovies.forEach((movie, index) => {
    doc.text(`${index + 1}. ${movie.title} (${movie.year}) - ⭐ ${movie.rating_imdb || 'N/A'}`, margin, yPos);
    yPos += 8;
  });

  doc.save(`relatorio-estatisticas-${today.toISOString().slice(0, 10)}.pdf`);
}

// Função para fechar modal
function closeModal() {
  document.getElementById('confirmation-modal').style.display = 'none';
}