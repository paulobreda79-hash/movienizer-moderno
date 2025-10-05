// login.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        // Armazenar sessão
        localStorage.setItem('sessionId', result.sessionId);
        localStorage.setItem('user', JSON.stringify(result.user));

        // Redirecionar para dashboard
        window.location.href = '/dashboard.html';
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