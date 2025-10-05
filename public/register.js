// register.js

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const errorMessage = document.getElementById('error-message');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const result = await response.json();

      if (result.success) {
        alert('Registro realizado com sucesso! Faça login para continuar.');
        window.location.href = '/login.html';
      } else {
        showError(result.error);
      }
    } catch (error) {
      showError('Erro de conexão com o servidor');
    }
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  }
});