document.addEventListener('DOMContentLoaded', () => {
  const btnAdicionarPessoa = document.getElementById("btn-adicionar-pessoa");
  const modalPessoa = document.getElementById("modal-pessoa");
  const fecharModalPessoa = document.getElementById("fechar-modal-pessoa");
  const conteudoPessoa = document.getElementById("conteudo-pessoa");

  btnAdicionarPessoa.addEventListener("click", () => {
    modalPessoa.style.display = "block";
    fetch("add-person.html")
      .then(res => res.text())
      .then(html => {
        conteudoPessoa.innerHTML = html;
      })
      .catch(err => {
        conteudoPessoa.innerHTML = "<p>Erro ao carregar o formulário de pessoa.</p>";
      });
  });

  fecharModalPessoa.addEventListener("click", () => {
    modalPessoa.style.display = "none";
    conteudoPessoa.innerHTML = "A carregar...";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modalPessoa) {
      modalPessoa.style.display = "none";
      conteudoPessoa.innerHTML = "A carregar...";
    }
  });
});
