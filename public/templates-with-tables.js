document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Quill
  const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ]
    }
  });

  // Templates padrão
  const defaultTemplates = {
    dashboard: `
      <h1>Relatório de Estatísticas - MovieNizer</h1>
      <p>Este relatório inclui gráficos, tabelas e estatísticas da sua coleção de filmes e pessoas.</p>
    `,
    summary: `
      <h1>Resumo Estatístico</h1>
      <p>Veja um resumo das estatísticas da sua coleção de filmes e pessoas.</p>
    `,
    movies: `
      <h1>Relatório de Filmes</h1>
      <p>Resumo dos filmes da sua coleção.</p>
    `,
    people: `
      <h1>Relatório de Pessoas</h1>
      <p>Resumo das pessoas (atores, diretores, etc.) da sua coleção.</p>
    `,
    awards: `
      <h1>Prêmios e Indicações</h1>
      <p>Relatório de prêmios conquistados por filmes e pessoas da sua coleção.</p>
    `
  };

  // Carregar template padrão
  quill.root.innerHTML = defaultTemplates.dashboard;

  // Eventos de navegação de templates
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const templateKey = btn.dataset.template;
      quill.root.innerHTML = defaultTemplates[templateKey] || defaultTemplates.dashboard;
      updatePreview();
    });
  });

  // Eventos de personalização
  document.getElementById('bg-color').addEventListener('input', updatePreview);
  document.getElementById('text-color').addEventListener('input', updatePreview);
  document.getElementById('font-family').addEventListener('change', updatePreview);
  document.getElementById('template-title').addEventListener('input', updatePreview);

  // Eventos de ações
  document.getElementById('btn-preview').addEventListener('click', togglePreview);
  document.getElementById('btn-save-template').addEventListener('click', saveTemplate);
  document.getElementById('btn-load-template').addEventListener('click', showLoadModal);
  document.getElementById('btn-load-selected').addEventListener('click', loadSelectedTemplate);
  document.getElementById('btn-cancel-load').addEventListener('click', hideLoadModal);
  document.getElementById('btn-export').addEventListener('click', exportTemplate);
  document.getElementById('btn-add-table').addEventListener('click', addTable);
  document.getElementById('btn-add-chart').addEventListener('click', addChart);

  // Carregar dados do banco
  async function loadTemplateData() {
    try {
      const [moviesResponse, peopleResponse] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/people')
      ]);

      if (!moviesResponse.ok || !peopleResponse.ok) {
        throw new Error('Erro ao carregar dados');
      }

      window.moviesData = await moviesResponse.json();
      window.peopleData = await peopleResponse.json();

    } catch (error) {
      console.error('Erro ao carregar dados para templates:', error);
      alert('Erro ao carregar dados para templates.');
    }
  }

  loadTemplateData();

  // Função para adicionar tabela
  function addTable() {
    const tableType = document.getElementById('table-type').value;
    const animationType = document.getElementById('animation-type').value;

    const tableId = `table-${Date.now()}`;
    const tableItem = document.createElement('div');
    tableItem.className = `table-item ${animationType}`;
    tableItem.id = tableId;

    let tableHTML = '<table><thead><tr>';

    if (tableType === 'top-movies') {
      tableHTML += '<th>Posição</th><th>Título</th><th>Ano</th><th>Rating</th></tr></thead><tbody>';
      const sortedMovies = [...window.moviesData].sort((a, b) => (b.rating_imdb || 0) - (a.rating_imdb || 0)).slice(0, 10);
      sortedMovies.forEach((movie, index) => {
        tableHTML += `<tr><td>${index + 1}</td><td>${movie.title}</td><td>${movie.year}</td><td>⭐ ${movie.rating_imdb || 'N/A'}</td></tr>`;
      });
    } else if (tableType === 'top-actors') {
      tableHTML += '<th>Posição</th><th>Nome</th><th>Filmes</th></tr></thead><tbody>';
      const sortedPeople = [...window.peopleData].sort((a, b) => (b.movies ? JSON.parse(b.movies).length : 0) - (a.movies ? JSON.parse(a.movies).length : 0)).slice(0, 10);
      sortedPeople.forEach((person, index) => {
        tableHTML += `<tr><td>${index + 1}</td><td>${person.name}</td><td>${person.movies ? JSON.parse(person.movies).length : 0}</td></tr>`;
      });
    } else if (tableType === 'movies-by-year') {
      tableHTML += '<th>Ano</th><th>Total de Filmes</th></tr></thead><tbody>';
      const yearCounts = {};
      window.moviesData.forEach(movie => {
        yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
      });
      Object.entries(yearCounts).forEach(([year, count]) => {
        tableHTML += `<tr><td>${year}</td><td>${count}</td></tr>`;
      });
    } else if (tableType === 'people-by-role') {
      tableHTML += '<th>Função</th><th>Total</th></tr></thead><tbody>';
      const roleCounts = {};
      window.peopleData.forEach(person => {
        JSON.parse(person.role || '[]').forEach(role => {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
      });
      Object.entries(roleCounts).forEach(([role, count]) => {
        tableHTML += `<tr><td>${role}</td><td>${count}</td></tr>`;
      });
    } else if (tableType === 'awards') {
      tableHTML += '<th>Filme</th><th>Prêmio</th><th>Ano</th></tr></thead><tbody>';
      tableHTML += `
        <tr><td>O Poderoso Chefão</td><td>Oscar - Melhor Filme</td><td>1973</td></tr>
        <tr><td>Matrix</td><td>Oscar - Melhor Efeitos Visuais</td><td>2000</td></tr>
        <tr><td>E.T.</td><td>Golden Globe - Melhor Filme Drama</td><td>1983</td></tr>
      `;
    }

    tableHTML += '</tbody></table>';
    tableItem.innerHTML = tableHTML;
    document.getElementById('tables-container').appendChild(tableItem);
  }

  // Função para adicionar gráfico
  function addChart() {
    const chartType = document.getElementById('chart-type').value;
    const chartData = document.getElementById('chart-data').value;
    const animationType = document.getElementById('chart-animation').value;

    const chartId = `chart-${Date.now()}`;
    const chartItem = document.createElement('div');
    chartItem.className = `chart-item ${animationType}`;
    chartItem.innerHTML = `<canvas id="${chartId}"></canvas>`;
    document.getElementById('charts-container').appendChild(chartItem);

    setTimeout(() => {
      renderChart(chartId, chartType, chartData);
    }, 100);
  }

  // Função para renderizar gráfico corrigida
  function renderChart(canvasId, type, dataKey) {
    if (!window.moviesData || !window.peopleData) {
      console.error('Dados não carregados');
      return;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');

    let config = {};

    if (dataKey === 'genres') {
      const genreCounts = {};
      window.moviesData.forEach(movie => {
        JSON.parse(movie.genres || '[]').forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });

      config = {
        type: type,
        data: {
          labels: Object.keys(genreCounts),
          datasets: [{
            label: 'Filmes por Gênero',
            data: Object.values(genreCounts),
            backgroundColor: [
              '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
              '#1abc9c', '#34495e', '#e67e22', '#16a085', '#8e44ad'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      };
    } else if (dataKey === 'years') {
      const yearCounts = {};
      window.moviesData.forEach(movie => {
        yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
      });

      const sortedYears = Object.keys(yearCounts).sort();

      config = {
        type: type,
        data: {
          labels: sortedYears,
          datasets: [{
            label: 'Filmes por Ano',
            data: sortedYears.map(year => yearCounts[year]),
            borderColor: '#3498db',
            backgroundColor: type === 'line' ? 'rgba(52, 152, 219, 0.2)' : '#3498db'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      };
    } else if (dataKey === 'ratings') {
      const genreRatings = {};
      window.moviesData.forEach(movie => {
        JSON.parse(movie.genres || '[]').forEach(genre => {
          if (!genreRatings[genre]) {
            genreRatings[genre] = { total: 0, count: 0 };
          }
          genreRatings[genre].total += movie.rating_imdb || 0;
          genreRatings[genre].count++;
        });
      });

      const avgRatings = Object.keys(genreRatings).map(genre =>
        (genreRatings[genre].total / genreRatings[genre].count).toFixed(2)
      );

      config = {
        type: type,
        data: {
          labels: Object.keys(genreRatings),
          datasets: [{
            label: 'Rating Médio',
            data: avgRatings,
            backgroundColor: '#2ecc71'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 10 }
          }
        }
      };
    } else if (dataKey === 'roles') {
      const roleCounts = {};
      window.peopleData.forEach(person => {
        JSON.parse(person.role || '[]').forEach(role => {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
      });

      config = {
        type: type,
        data: {
          labels: Object.keys(roleCounts),
          datasets: [{
            data: Object.values(roleCounts),
            backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      };
    }

    new Chart(ctx, config);
  }

  // Função para atualizar pré-visualização
  function updatePreview() {
    const bgColor = document.getElementById('bg-color').value;
    const textColor = document.getElementById('text-color').value;
    const fontFamily = document.getElementById('font-family').value;
    const title = document.getElementById('template-title').value;
    const content = quill.root.innerHTML;

    // Gerar HTML com tabelas e gráficos
    let tablesHTML = '';
    document.querySelectorAll('.table-item').forEach(item => {
      tablesHTML += `<div class="table-container">${item.innerHTML}</div>`;
    });

    let chartsHTML = '';
    document.querySelectorAll('.chart-item').forEach(item => {
      const canvas = item.querySelector('canvas');
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        chartsHTML += `<img src="${imgData}" style="width:100%; margin:10px 0;" />`;
      }
    });

    const previewHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              background-color: ${bgColor};
              color: ${textColor};
              font-family: ${fontFamily};
              padding: 20px;
              margin: 0;
            }
            h1 {
              color: #3498db;
            }
            .table-container {
              margin: 20px 0;
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            table th,
            table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            table th {
              background: #f8f9fa;
              font-weight: bold;
              color: #555;
            }
            table tr:nth-child(even) {
              background: #fafafa;
            }
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }
              table {
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content}
          ${tablesHTML}
          ${chartsHTML}
        </body>
      </html>
    `;

    const previewFrame = document.getElementById('preview-frame');
    const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    previewDoc.open();
    previewDoc.write(previewHTML);
    previewDoc.close();
  }

  // Função para alternar pré-visualização
  function togglePreview() {
    const previewSection = document.getElementById('preview-section');
    if (previewSection.style.display === 'none') {
      updatePreview();
      previewSection.style.display = 'block';
    } else {
      previewSection.style.display = 'none';
    }
  }

  // Função para salvar template
  function saveTemplate() {
    const templateName = prompt('Nome do template:');
    if (!templateName) return;

    const templateData = {
      name: templateName,
      content: quill.root.innerHTML,
      bgColor: document.getElementById('bg-color').value,
      textColor: document.getElementById('text-color').value,
      fontFamily: document.getElementById('font-family').value,
      title: document.getElementById('template-title').value,
      tables: Array.from(document.querySelectorAll('.table-item')).map(item => {
        return {
          html: item.innerHTML,
          animation: item.className.replace('table-item ', '')
        };
      }),
      charts: Array.from(document.querySelectorAll('.chart-item')).map(item => {
        const canvas = item.querySelector('canvas');
        return {
          data: canvas ? canvas.toDataURL('image/png') : null,
          animation: item.className.replace('chart-item ', '')
        };
      })
    };

    let templates = JSON.parse(localStorage.getItem('animatedTemplates') || '[]');
    templates.push(templateData);
    localStorage.setItem('animatedTemplates', JSON.stringify(templates));

    alert(`Template "${templateName}" salvo com sucesso!`);
  }

  // Função para mostrar modal de carregar
  function showLoadModal() {
    const templates = JSON.parse(localStorage.getItem('animatedTemplates') || '[]');
    const templateList = document.getElementById('template-list');
    templateList.innerHTML = '<option value="">Selecione um template salvo...</option>';

    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.name;
      option.textContent = template.name;
      templateList.appendChild(option);
    });

    document.getElementById('load-modal').style.display = 'flex';
  }

  // Função para esconder modal de carregar
  function hideLoadModal() {
    document.getElementById('load-modal').style.display = 'none';
  }

  // Função para carregar template selecionado
  function loadSelectedTemplate() {
    const templateName = document.getElementById('template-list').value;
    if (!templateName) {
      alert('Selecione um template para carregar.');
      return;
    }

    const templates = JSON.parse(localStorage.getItem('animatedTemplates') || '[]');
    const template = templates.find(t => t.name === templateName);

    if (template) {
      quill.root.innerHTML = template.content;
      document.getElementById('bg-color').value = template.bgColor;
      document.getElementById('text-color').value = template.textColor;
      document.getElementById('font-family').value = template.fontFamily;
      document.getElementById('template-title').value = template.title;

      // Recarregar tabelas
      document.getElementById('tables-container').innerHTML = '';
      template.tables.forEach(tableData => {
        const tableItem = document.createElement('div');
        tableItem.className = `table-item ${tableData.animation}`;
        tableItem.innerHTML = tableData.html;
        document.getElementById('tables-container').appendChild(tableItem);
      });

      // Recarregar gráficos
      document.getElementById('charts-container').innerHTML = '';
      template.charts.forEach(chartData => {
        if (chartData.data) {
          const chartItem = document.createElement('div');
          chartItem.className = `chart-item ${chartData.animation}`;
          chartItem.innerHTML = `<img src="${chartData.data}" style="width:100%;" />`;
          document.getElementById('charts-container').appendChild(chartItem);
        }
      });

      updatePreview();
      hideLoadModal();
      alert(`Template "${templateName}" carregado com sucesso!`);
    }
  }

  // Função para exportar template
  function exportTemplate() {
    const bgColor = document.getElementById('bg-color').value;
    const textColor = document.getElementById('text-color').value;
    const fontFamily = document.getElementById('font-family').value;
    const title = document.getElementById('template-title').value;
    const content = quill.root.innerHTML;

    let tablesHTML = '';
    document.querySelectorAll('.table-item').forEach(item => {
      tablesHTML += `<div class="table-container">${item.innerHTML}</div>`;
    });

    let chartsHTML = '';
    document.querySelectorAll('.chart-item').forEach(item => {
      const img = item.querySelector('img');
      if (img) {
        chartsHTML += `<img src="${img.src}" style="width:100%; margin:10px 0;" />`;
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              background-color: ${bgColor};
              color: ${textColor};
              font-family: ${fontFamily};
              padding: 20px;
              margin: 0;
            }
            h1 {
              color: #3498db;
            }
            .table-container {
              margin: 20px 0;
              overflow-x: auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            table th,
            table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            table th {
              background: #f8f9fa;
              font-weight: bold;
              color: #555;
            }
            table tr:nth-child(even) {
              background: #fafafa;
            }
            @media (max-width: 600px) {
              body {
                padding: 10px;
              }
              table {
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content}
          ${tablesHTML}
          ${chartsHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `template-${title.replace(/\s+/g, '-').toLowerCase()}.html`;
    link.click();

    URL.revokeObjectURL(url);
  }
});
