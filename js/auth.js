// Default admin credentials (change in production)
const DEFAULT_ADMIN = {
  email: 'admin@ecommerce.com',
  password: 'admin123',
  name: 'Super Admin',
  role: 'admin'
};

// Initialize default admin if not present
(function initAuth() {
  const users = JSON.parse(localStorage.getItem('admin_users') || '[]');
  if (users.length === 0) {
    users.push(DEFAULT_ADMIN);
    localStorage.setItem('admin_users', JSON.stringify(users));
  }
})();

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3200);
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  const users = JSON.parse(localStorage.getItem('admin_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    const session = {
      email: user.email,
      name: user.name || 'Admin',
      role: user.role || 'admin',
      loginTime: Date.now()
    };
    if (remember) {
      localStorage.setItem('admin_session', JSON.stringify(session));
    } else {
      sessionStorage.setItem('admin_session', JSON.stringify(session));
    }
    showToast('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 800);
  } else {
    showToast('Invalid email or password', 'error');
  }
});

document.getElementById('registerBtn').addEventListener('click', function () {
  showToast('Registration is disabled in this demo. Use admin@ecommerce.com / admin123', 'error');
});

document.getElementById('forgotLink').addEventListener('click', function (e) {
  e.preventDefault();
  showToast('Password reset is not available in this demo.', 'error');
});

// Auto-redirect if already logged in
(function checkSession() {
  const session = localStorage.getItem('admin_session') || sessionStorage.getItem('admin_session');
  if (session) {
    window.location.href = 'dashboard.html';
  }
})();
