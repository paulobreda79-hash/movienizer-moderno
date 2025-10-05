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

  // Eventos navegação templates
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const templateKey = btn.dataset.template;
      quill.root.innerHTML = defaultTemplates[templateKey] || defaultTemplates.dashboard;
      updatePreview();
    });
  });

  // Eventos personalização
  document.getElementById('bg-color').addEventListener('input', updatePreview);
  document.getElementById('text-color').addEventListener('input', updatePreview);
  document.getElementById('font-family').addEventListener('change', updatePreview);
  document.getElementById('template-title').addEventListener('input', updatePreview);

  // Eventos ações
  document.getElementById('btn-preview').addEventListener('click', togglePreview);
  document.getElementById('btn-save-template').addEventListener('click', saveTemplate);
  document.getElementById('btn-load-template').addEventListener('click', showLoadModal);
  document.getElementById('btn-load-selected').addEventListener('click', loadSelectedTemplate);
  document.getElementById('btn-cancel-load').addEventListener('click', hideLoadModal);
  document.getElementById('btn-export').addEventListener('click', exportTemplate);
  document.getElementById('btn-play-animations').addEventListener('click', playAnimations);
  document.getElementById('btn-add-table').addEventListener('click', addTable);
  document.getElementById('btn-add-chart').addEventListener('click', addChart);
  document.getElementById('btn-add-transition').addEventListener('click', addTransition);

  // Carregar dados
  async function loadTemplateData() {
    try {
      const [moviesResponse, peopleResponse] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/people')
      ]);

      if (!moviesResponse.ok || !peopleResponse.ok) throw new Error('Erro ao carregar dados');

      window.moviesData = await moviesResponse.json();
      window.peopleData = await peopleResponse.json();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados para templates.');
    }
  }
  loadTemplateData();

  // Exemplo simplificado: Função adicionar tabela (deve ser detalhada conforme código original)
  function addTable() {
    // Implementação a partir do código original, construindo tabelas dinâmicas
  }

  // Adicionar gráfico com correção na configuração do Chart.js
  function addChart() {
    const chartType = document.getElementById('chart-type').value;
    const chartData = document.getElementById('chart-data').value;
    const entryAnimation = document.getElementById('entry-animation').value;
    const speed = document.getElementById('animation-speed').value;
    const delay = document.getElementById('animation-delay').value;

    const chartId = `chart-${Date.now()}`;
    const chartItem = document.createElement('div');
    chartItem.className = `chart-item ${entryAnimation}`;
    chartItem.id = chartId;

    if (speed === 'slow') chartItem.style.animationDuration = '1s';
    else if (speed === 'fast') chartItem.style.animationDuration = '0.3s';
    else chartItem.style.animationDuration = '0.5s';

    chartItem.style.animationDelay = `${delay}ms`;

    chartItem.innerHTML = `<canvas id="${chartId}"></canvas>`;
    document.getElementById('charts-container').appendChild(chartItem);

    setTimeout(() => { renderChart(chartId, chartType, chartData); }, 100);
  }

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
        type,
        data: {
          labels: Object.keys(genreCounts),
          datasets: [{
            label: 'Filmes por Gênero',
            data: Object.values(genreCounts),
            backgroundColor: [
              '#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6',
              '#1abc9c','#34495e','#e67e22','#16a085','#8e44ad'
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
        type,
        data: {
          labels: sortedYears,
          datasets: [{
            label: 'Filmes por Ano',
            data: sortedYears.map(year => yearCounts[year]),
            borderColor: '#3498db',
            backgroundColor: (type === 'line' ? 'rgba(52, 152, 219, 0.2)' : '#3498db')
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } }
        }
      };
    } else if (dataKey === 'ratings') {
      const genreRatings = {};
      window.moviesData.forEach(movie => {
        JSON.parse(movie.genres || '[]').forEach(genre => {
          if (!genreRatings[genre]) genreRatings[genre] = { total: 0, count: 0 };
          genreRatings[genre].total += movie.rating_imdb || 0;
          genreRatings[genre].count++;
        });
      });
      const avgRatings = Object.keys(genreRatings).map(genre =>
        (genreRatings[genre].total / genreRatings[genre].count).toFixed(2)
      );
      config = {
        type,
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
          scales: { y: { beginAtZero: true, max: 10 } }
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
        type,
        data: {
          labels: Object.keys(roleCounts),
          datasets: [{
            data: Object.values(roleCounts),
            backgroundColor: ['#3498db','#e74c3c','#2ecc71','#f39c12','#9b59b6']
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

  function playAnimations() {
    const elements = document.querySelectorAll('.table-item, .chart-item, .transition-item');
    const entryAnimation = document.getElementById('entry-animation').value;
    const speed = document.getElementById('animation-speed').value;
    const delay = document.getElementById('animation-delay').value;

    elements.forEach((element, index) => {
      element.classList.remove(entryAnimation);
      void element.offsetWidth;
      element.classList.add(entryAnimation);

      if (speed === 'slow') element.style.animationDuration = '1s';
      else if (speed === 'fast') element.style.animationDuration = '0.3s';
      else element.style.animationDuration = '0.5s';

      element.style.animationDelay = `${index * parseInt(delay)}ms`;
    });
  }

  // Funções updatePreview, togglePreview, saveTemplate, showLoadModal,
  // hideLoadModal, loadSelectedTemplate, exportTemplate devem ser mantidas conforme o código original,
  // com direito à adaptação similar à função saveTemplate para salvar imagens de gráficos sob propriedade nomeada `data`.

});
