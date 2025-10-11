const btnAbrir = document.getElementById("btn-adicionar-filme");
const modal = document.getElementById("modal-filme");
const fechar = document.getElementById("fechar-modal");
const conteudo = document.getElementById("conteudo-filme");

btnAbrir.addEventListener("click", () => {
  modal.style.display = "block";

  fetch("add-movie.html")
    .then(res => res.text())
    .then(html => {
      conteudo.innerHTML = html;

      // Espera o DOM do conteúdo ser inserido antes de inicializar
      setTimeout(() => {
        if (typeof inicializarFormulario === "function") {
          inicializarFormulario();
        } else {
          console.warn("Função inicializarFormulario não encontrada.");
        }
      }, 50);
    })
    .catch(err => {
      conteudo.innerHTML = "<p>Erro ao carregar o formulário.</p>";
      console.error("Erro ao carregar o ficheiro:", err);
    });
});

fechar.addEventListener("click", () => {
  modal.style.display = "none";
  conteudo.innerHTML = "A carregar...";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    conteudo.innerHTML = "A carregar...";
  }
});


//JavaScript para abrir o modal e carregar o formulário para o botão Adicionar Filmes
document.addEventListener("DOMContentLoaded", () => {
  const btnAdicionar = document.getElementById("add-filme-btn");
  const modal = document.getElementById("modal-filme");
  const conteudo = document.getElementById("conteudo-filme");

  btnAdicionar.addEventListener("click", () => {
    modal.style.display = "block";

    fetch("add-movie.html")
      .then(res => res.text())
      .then(html => {
        conteudo.innerHTML = html;

        // Espera o DOM ser inserido antes de inicializar
        setTimeout(() => {
          if (typeof inicializarFormulario === "function") {
            inicializarFormulario();
          } else {
            console.warn("Função inicializarFormulario não encontrada.");
          }
        }, 50);
      })
      .catch(err => {
        conteudo.innerHTML = "<p>Erro ao carregar o formulário.</p>";
        console.error("Erro ao carregar o ficheiro:", err);
      });
  });
});