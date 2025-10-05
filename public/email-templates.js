// email-templates.js

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
    default: `
      <h1 style="color: #3498db;">Relatório de Filmes - MovieNizer</h1>
      <p>Olá,</p>
      <p>Segue em anexo o relatório com as estatísticas da minha coleção de filmes.</p>
      <p>Inclui gráficos de filmes por gênero, rating médio, top 10 filmes e mais.</p>
      <p>Abraços,</p>
    `,
    movies: `
      <h1 style="color: #3498db;">Relatório de Filmes</h1>
      <p>Resumo:</p>
      <ul>
        <li>Total de Filmes: 150</li>
        <li>Média de Rating: 7.8</li>
        <li>Filmes Vistos: 120</li>
      </ul>
      <h2>Top 5 Filmes</h2>
      <ol>
        <li>O Poderoso Chefão (1972) - ⭐ 9.2</li>
        <li>Matrix (1999) - ⭐ 8.7</li>
        <li>E.T. (1982) - ⭐ 7.8</li>
        <li>Jurassic Park (1993) - ⭐ 8.1</li>
        <li>Apocalypse Now (1979) - ⭐ 8.4</li>
      </ol>
    `,
    people: `
      <h1 style="color: #3498db;">Relatório de Pessoas</h1>
      <p>Resumo:</p>
      <ul>
        <li>Total de Pessoas: 85</li>
        <li>Atores: 60</li>
        <li>Diretores: 20</li>
        <li>Produtores: 5</li>
      </ul>
      <h2>Top 5 Atores Mais Atuados</h2>
      <ol>
        <li>Marlon Brando - 12 filmes</li>
        <li>Al Pacino - 10 filmes</li>
        <li>Robert De Niro - 9 filmes</li>
        <li>Tom Hanks - 8 filmes</li>
        <li>Leonardo DiCaprio - 7 filmes</li>
      </ol>
    `,
    awards: `
      <h1 style="color: #3498db;">Prêmios e Indicações</h1>
      <p>Relatório de prêmios conquistados por filmes e pessoas da sua coleção.</p>
      <h2>Filmes com Oscar</h2>
      <ul>
        <li>O Poderoso Chefão - Melhor Filme (1973)</li>
        <li>Matrix - Melhor Efeitos Visuais (2000)</li>
      </ul>
    `,
    streaming: `
      <h1 style="color: #3498db;">Disponibilidade em Plataformas</h1>
      <p>Veja quais filmes da sua coleção estão disponíveis em plataformas de streaming.</p>
      <h2>Netflix</h2>
      <ul>
        <li>Matrix</li>
        <li>Forrest Gump</li>
      </ul>
      <h2>Disney+</h2>
      <ul>
        <li>E.T.</li>
        <li>Star Wars</li>
      </ul>
    `
  };

  // Carregar template padrão
  quill.root.innerHTML = defaultTemplates.default;

  // Eventos de navegação de templates
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const templateKey = btn.dataset.template;
      quill.root.innerHTML = defaultTemplates[templateKey] || defaultTemplates.default;
      updatePreview();
    });
  });

  // Eventos de personalização
  document.getElementById('bg-color').addEventListener('input', updatePreview);
  document.getElementById('text-color').addEventListener('input', updatePreview);
  document.getElementById('font-family').addEventListener('change', updatePreview);
  document.getElementById('template-title').addEventListener('input', updatePreview);
  document.getElementById('editor').addEventListener('input', updatePreview);

  // Eventos de ações
  document.getElementById('btn-preview').addEventListener('click', togglePreview);
  document.getElementById('btn-save-template').addEventListener('click', saveTemplate);
  document.getElementById('btn-load-template').addEventListener('click', showLoadModal);
  document.getElementById('btn-load-selected').addEventListener('click', loadSelectedTemplate);
  document.getElementById('btn-cancel-load').addEventListener('click', hideLoadModal);
  document.getElementById('btn-export').addEventListener('click', exportTemplate);

  // Função para atualizar pré-visualização
  function updatePreview() {
    const bgColor = document.getElementById('bg-color').value;
    const textColor = document.getElementById('text-color').value;
    const fontFamily = document.getElementById('font-family').value;
    const title = document.getElementById('template-title').value;
    const content = quill.root.innerHTML;

    const previewHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              background-color: ${bgColor};
              color: ${textColor};
              font-family: ${fontFamily};
              padding: 20px;
            }
            h1 {
              color: #3498db;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content}
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
      subject: document.getElementById('email-subject').value
    };

    // Salvar no localStorage
    let templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
    templates.push(templateData);
    localStorage.setItem('emailTemplates', JSON.stringify(templates));

    alert(`Template "${templateName}" salvo com sucesso!`);
  }

  // Função para mostrar modal de carregar
  function showLoadModal() {
    const templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
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

    const templates = JSON.parse(localStorage.getItem('emailTemplates') || '[]');
    const template = templates.find(t => t.name === templateName);

    if (template) {
      quill.root.innerHTML = template.content;
      document.getElementById('bg-color').value = template.bgColor;
      document.getElementById('text-color').value = template.textColor;
      document.getElementById('font-family').value = template.fontFamily;
      document.getElementById('template-title').value = template.title;
      document.getElementById('email-subject').value = template.subject;

      updatePreview();
      hideLoadModal();
      alert(`Template "${templateName}" carregado com sucesso!`);
    }
  }

  // Função para exportar template
  function exportTemplate() {
    const templateData = {
      content: quill.root.innerHTML,
      bgColor: document.getElementById('bg-color').value,
      textColor: document.getElementById('text-color').value,
      fontFamily: document.getElementById('font-family').value,
      title: document.getElementById('template-title').value,
      subject: document.getElementById('email-subject').value
    };

    const dataStr = JSON.stringify(templateData, null, 2);
    const dataUri = 'application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `template-email-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
});