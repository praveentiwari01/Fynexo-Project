async function apiRequest(method, url, body = null) {
  const token = localStorage.getItem('mm_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(API_BASE + url, options);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

const Auth = {
  async register(name, email, password) {
    const result = await apiRequest('POST', '/api/auth/signup', { name, email, password });
    if (result.ok) {
      localStorage.setItem('mm_token', result.data.token);
      if (result.data.user && result.data.user.avatar) {
        localStorage.setItem('mm_avatar', result.data.user.avatar);
      }
      return { success: true };
    }
    return { success: false, error: result.data.error || 'Registration failed' };
  },

  async login(email, password, remember) {
    const result = await apiRequest('POST', '/api/auth/login', { email, password });
    if (result.ok) {
      localStorage.setItem('mm_token', result.data.token);
      if (remember) {
        localStorage.setItem('mm_remember', email);
      } else {
        localStorage.removeItem('mm_remember');
      }
      localStorage.removeItem('mm_is_guest');
      if (result.data.user && result.data.user.avatar) {
        localStorage.setItem('mm_avatar', result.data.user.avatar);
      } else {
        localStorage.removeItem('mm_avatar');
      }
      return { success: true };
    }
    return { success: false, error: result.data.error || 'Login failed' };
  },

  guestLogin() {
    const guestId = 'guest_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('mm_session', JSON.stringify({ email: guestId }));
    localStorage.setItem('mm_is_guest', 'true');
    return { success: true };
  },

  logout() {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      localStorage.removeItem('mm_is_guest');
      localStorage.removeItem('mm_session');
    }
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_avatar');
    window.location.href = 'login.html';
  },

  async getCurrentUser() {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      return { name: 'Guest', email: 'guest', isGuest: true };
    }

    const token = localStorage.getItem('mm_token');
    if (!token) return null;

    const result = await apiRequest('GET', '/api/auth/me');
    if (result.ok) {
      if (result.data.avatar) {
        localStorage.setItem('mm_avatar', result.data.avatar);
      }
      return result.data;
    }
    return null;
  },

  async updateAvatar(avatarData) {
    const result = await apiRequest('PUT', '/api/auth/avatar', { avatar: avatarData });
    if (result.ok) {
      localStorage.setItem('mm_avatar', avatarData);
      return { success: true };
    }
    return { success: false, error: result.data.error || 'Failed to update avatar' };
  },

  getToken() {
    return localStorage.getItem('mm_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('mm_token') || localStorage.getItem('mm_is_guest') === 'true';
  },

  protect() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (loginForm) {
    const remembered = localStorage.getItem('mm_remember');
    if (remembered) {
      document.getElementById('loginEmail').value = remembered;
      document.getElementById('rememberMe').checked = true;
    }

    const loginCurrency = document.getElementById('loginCurrency');
    if (loginCurrency) {
      const saved = Currency.getCurrent();
      loginCurrency.value = saved.code;
      loginCurrency.addEventListener('change', () => Currency.set(loginCurrency.value));
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const remember = document.getElementById('rememberMe').checked;
      const errorEl = document.getElementById('loginError');

      if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        errorEl.classList.add('show');
        return;
      }

      if (loginCurrency) Currency.set(loginCurrency.value);

      const result = await Auth.login(email, password, remember);
      if (result.success) {
        window.location.href = 'dashboard.html';
      } else {
        errorEl.textContent = result.error;
        errorEl.classList.add('show');
      }
    });

    const guestBtn = document.getElementById('guestLoginBtn');
    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        if (loginCurrency) Currency.set(loginCurrency.value);
        Auth.guestLogin();
        window.location.href = 'dashboard.html';
      });
    }
  }

  if (signupForm) {
    const signupCurrency = document.getElementById('signupCurrency');
    if (signupCurrency) {
      const saved = Currency.getCurrent();
      signupCurrency.value = saved.code;
      signupCurrency.addEventListener('change', () => Currency.set(signupCurrency.value));
    }

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const errorEl = document.getElementById('signupError');

      if (!name || !email || !password) {
        errorEl.textContent = 'Please fill in all fields.';
        errorEl.classList.add('show');
        return;
      }

      if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        errorEl.classList.add('show');
        return;
      }

      if (signupCurrency) Currency.set(signupCurrency.value);

      const result = await Auth.register(name, email, password);
      if (result.success) {
        window.location.href = 'dashboard.html';
      } else {
        errorEl.textContent = result.error;
        errorEl.classList.add('show');
      }
    });
  }
});
