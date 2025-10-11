function inicializarFormulario() {
  const form = document.getElementById("form-add-movie");
  if (!form) {
    console.warn("Formulário não encontrado.");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const modo = form.querySelector('input[name="add_option"]:checked').value;
    const titulos = form.movieTitles.value.trim();

    if (!titulos) {
      alert("Por favor, introduza pelo menos um título.");
      return;
    }

    alert(`Modo: ${modo}\nTítulos:\n${titulos}`);
  });

  form.addEventListener("reset", () => {
    console.log("Formulário cancelado.");
  });
}


//JavaScript para abrir o modal e carregar o formulário para o botão Adicionar Filmes
function inicializarFormulario() {
  const form = document.getElementById("form-add-movie");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const modo = form.querySelector('input[name="add_option"]:checked').value;
    const titulos = form.movieTitles.value.trim();

    if (!titulos) {
      alert("Por favor, introduza pelo menos um título.");
      return;
    }

    alert(`Modo: ${modo}\nTítulos:\n${titulos}`);
  });

  form.addEventListener("reset", () => {
    console.log("Formulário cancelado.");
  });
}