const App = {
  currentTab: 'dashboard',

  async init() {
    if (!Auth.protect()) return;
    this.loadTheme();
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupProfile();
    this.setupFAB();
    this.setupHamburger();
    this.setupSidebarToggle();
    this.setupTooltips();
    this.setupSettings();
    this.setupModalClose();
    this.setupNotificationBell();
    await Expenses.init();
    await Income.init();
    await Investments.init();
    await Goals.init();
    this.restoreSections();
    this.loadUserInfo();
    this.updateNavbarBalance();
    this.navigate('dashboard');
    setTimeout(() => {
      document.getElementById('loadingScreen')?.classList.add('hidden');
    }, 300);
  },

  loadUserInfo() {
    const user = Auth.getCurrentUser();
    if (user && user.then) {
      user.then(u => this._renderUserInfo(u));
    } else {
      this._renderUserInfo(user);
    }
    const label = document.getElementById('profileCurrencyLabel');
    if (label) label.textContent = Currency.getCurrent().code;
  },

  async _renderUserInfo(user) {
    if (!user) {
      user = await Auth.getCurrentUser();
    }
    if (user) {
      const isGuest = user.isGuest;
      const name = isGuest ? 'Guest' : user.name || 'User';
      const letter = isGuest ? 'G' : (user.name ? user.name.charAt(0).toUpperCase() : 'U');
      const avatar = isGuest ? null : (user.avatar || localStorage.getItem('mm_avatar'));

      document.querySelectorAll('.profile-name').forEach(el => {
        el.textContent = name;
      });

      this._setAvatar('profileAvatarImg', 'profileAvatarLetter', avatar, letter);
      this._setAvatar('profileMenuAvatarImg', 'profileMenuAvatarLetter', avatar, letter);

      const emailEl = document.getElementById('profileEmail');
      if (emailEl) {
        emailEl.textContent = isGuest ? 'Guest Account' : user.email || '';
      }
    }
  },

  _setAvatar(imgId, letterId, avatar, letter) {
    const img = document.getElementById(imgId);
    const span = document.getElementById(letterId);
    if (!img || !span) return;
    if (avatar) {
      img.src = avatar;
      img.style.display = 'block';
      span.style.display = 'none';
    } else {
      img.style.display = 'none';
      span.style.display = 'block';
      span.textContent = letter;
    }
  },

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab) this.navigate(tab);
      });
    });
  },

  navigate(tab) {
    this.currentTab = tab;

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`.nav-item[data-tab="${tab}"]`).forEach(el => el.classList.add('active'));

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`${tab}Tab`);
    if (target) target.classList.add('active');

    const titles = {
      dashboard: 'Dashboard',
      income: 'Income',
      expenses: 'Expenses',
      investments: 'Investments',
      analytics: 'Analytics',
      history: 'Transaction History',
      budgets: 'Budgets',
      goals: 'Savings Goals'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[tab] || 'Dashboard';

    this.updateContent(tab);
  },

  updateContent(tab) {
    switch (tab) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'income':
        renderIncomes();
        break;
      case 'expenses':
        renderExpenses();
        break;
      case 'investments':
        renderInvestments();
        break;
      case 'analytics':
        setTimeout(renderAllCharts, 100);
        break;
      case 'history':
        this.renderTransactionHistory();
        break;
      case 'budgets':
        renderBudgets();
        break;
      case 'goals':
        renderGoals();
        break;
    }
  },

  updateNavbarBalance() {
    const totalIncome = Income.getTotal();
    const totalExpenses = Expenses.getTotal();
    const balance = totalIncome - totalExpenses;
    const el = document.getElementById('navbarBalanceValue');
    if (el) el.textContent = Utils.formatCurrency(balance);
  },

  renderDashboard() {
    const totalIncome = Income.getTotal();
    const totalExpenses = Expenses.getTotal();
    const totalInvestments = Investments.getTotal();
    const totalSavings = Math.max(totalIncome - totalExpenses, 0);
    const totalBalance = totalIncome - totalExpenses;

    this.animateCounter('totalBalance', totalBalance);
    this.animateCounter('totalExpenses', totalExpenses);
    this.animateCounter('totalIncome', totalIncome);
    this.animateCounter('totalSavings', totalSavings);
    this.animateCounter('totalInvestments', totalInvestments);
    this.updateNavbarBalance();

    const greetingEl = document.getElementById('greetingText');
    if (greetingEl) {
      const hours = new Date().getHours();
      const greeting = hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : 'Good Evening';
      const user = Auth.getCurrentUser();
      if (user && user.then) {
        user.then(u => {
          const name = u?.isGuest ? 'there' : (u?.name || 'there').split(' ')[0];
          greetingEl.textContent = `${greeting}, ${name} 👋`;
        });
      } else {
        const name = user?.isGuest ? 'there' : (user?.name || 'there').split(' ')[0];
        greetingEl.textContent = `${greeting}, ${name} 👋`;
      }
    }

    this.renderRecentTransactions();
    if (typeof renderAllCharts === 'function') renderAllCharts();

    document.querySelectorAll('.summary-card').forEach(el => el.classList.remove('animate-fade-in'));
    void document.body.offsetWidth;
    document.querySelectorAll('.summary-card').forEach((el, i) => {
      el.classList.add('animate-fade-in', `animate-fade-in-delay-${i + 1}`);
    });
  },

  animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = Utils.formatCurrency(target);
  },

  renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    const allTxns = [
      ...Income.getAll().map(i => ({ ...i, type: 'income', label: 'Income' })),
      ...Expenses.getAll().map(e => ({ ...e, type: 'expense', label: 'Expense' })),
      ...Investments.getAll().map(i => ({ ...i, title: i.investmentName || i.title, type: 'investment', label: 'Investment' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (!allTxns.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="list" class="empty-state-icon" style="width:36px;height:36px"></i>
          <h3>No transactions yet</h3>
          <p>Start adding income or expenses.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const iconMap = {
      'Salary': 'briefcase', 'Freelance': 'laptop', 'Business': 'building',
      'Investment Returns': 'trending-up', 'Other': 'circle-dollar-sign',
      'Food': 'utensils-crossed', 'Travel': 'plane', 'Shopping': 'shopping-bag',
      'Bills': 'receipt', 'Entertainment': 'clapperboard', 'Others': 'more-horizontal',
      'Stocks': 'trending-up', 'Mutual Funds': 'bar-chart-3', 'Crypto': 'bitcoin',
      'Gold': 'circle-dollar-sign', 'SIP': 'repeat', 'Fixed Deposit': 'landmark'
    };

    container.innerHTML = allTxns.map(t => `
      <div class="transaction-item">
        <div class="transaction-icon ${t.type}">
          <i data-lucide="${iconMap[t.category] || 'circle'}" style="width:16px;height:16px"></i>
        </div>
        <div class="transaction-info">
          <div class="transaction-title">${t.title}</div>
          <div class="transaction-category">${t.category || t.type}</div>
        </div>
        <div style="text-align:right">
          <div class="transaction-amount ${t.type === 'expense' ? 'negative' : 'positive'}">
            ${t.type === 'expense' ? '-' : '+'}${Utils.formatCurrency(t.amount)}
          </div>
          <div class="transaction-date">${Utils.formatDate(t.date)}</div>
        </div>
      </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderTransactionHistory() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    const searchVal = document.getElementById('historySearch')?.value?.toLowerCase() || '';
    const typeFilter = document.getElementById('historyTypeFilter')?.value || 'all';

    let txns = [
      ...Income.getAll().map(i => ({ ...i, txnType: 'Income', sign: 'positive' })),
      ...Expenses.getAll().map(e => ({ ...e, txnType: 'Expense', sign: 'negative' })),
      ...Investments.getAll().map(i => ({ ...i, title: i.investmentName || i.title, category: i.type || i.category, txnType: 'Investment', sign: 'positive' }))
    ];

    if (typeFilter !== 'all') {
      txns = txns.filter(t => t.txnType === typeFilter);
    }

    if (searchVal) {
      txns = txns.filter(t =>
        (t.title || '').toLowerCase().includes(searchVal) ||
        (t.category || '').toLowerCase().includes(searchVal) ||
        (t.txnType || '').toLowerCase().includes(searchVal)
      );
    }

    txns.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!txns.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <i data-lucide="search" class="empty-state-icon" style="width:48px;height:48px"></i>
              <h3>No transactions found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          </td>
        </tr>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const getBadge = (type) => {
      if (type === 'Expense') return '<span class="badge badge-red">Expense</span>';
      if (type === 'Investment') return '<span class="badge badge-blue">Investment</span>';
      return '<span class="badge badge-green">Income</span>';
    };

    tbody.innerHTML = txns.map(t => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            ${getBadge(t.txnType)}
            <span>${t.title}</span>
          </div>
        </td>
        <td>${t.category || '-'}</td>
        <td>${Utils.formatDate(t.date)}</td>
        <td class="transaction-amount ${t.sign}">${t.sign === 'negative' ? '-' : '+'}${Utils.formatCurrency(t.amount)}</td>
        <td style="text-align:right;font-size:11px;color:var(--text-lighter)">${t.txnType}</td>
      </tr>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  setupThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    const updateIcon = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.innerHTML = isDark
        ? '<i data-lucide="sun" style="width:18px;height:18px"></i>'
        : '<i data-lucide="moon" style="width:18px;height:18px"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    updateIcon();

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('mm_theme', next);
      updateIcon();
      this._syncProfileThemeToggle();

      if (chartInstances && Object.keys(chartInstances).length > 0) {
        if (typeof renderAllCharts === 'function') renderAllCharts();
      }
    });
  },

  loadTheme() {
    const saved = localStorage.getItem('mm_theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  },

  setupProfile() {
    const trigger = document.getElementById('profileTrigger');
    const menu = document.getElementById('profileMenu');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    });

    document.addEventListener('click', () => menu.classList.remove('active'));

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
          Auth.logout();
        }
      });
    }

    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const fileInput = document.getElementById('avatarFileInput');
    if (changePhotoBtn && fileInput) {
      changePhotoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isGuest = localStorage.getItem('mm_is_guest') === 'true';
        if (isGuest) {
          Toast.info('Sign in to upload a profile photo.');
          return;
        }
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          Toast.error('Image too large. Max 5MB.');
          return;
        }
        try {
          Toast.info('Uploading...');
          const avatarData = await resizeImage(file, 200, 200, 0.7);
          const result = await Auth.updateAvatar(avatarData);
          if (result.success) {
            this._setAvatar('profileAvatarImg', 'profileAvatarLetter', avatarData, 'U');
            this._setAvatar('profileMenuAvatarImg', 'profileMenuAvatarLetter', avatarData, 'U');
            menu.classList.remove('active');
            Toast.success('Profile photo updated!');
          } else {
            Toast.error(result.error || 'Failed to update photo');
          }
        } catch (err) {
          Toast.error('Failed to upload image.');
        }
        fileInput.value = '';
      });
    }

    const editBtn = document.getElementById('profileEditBtn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profileMenu')?.classList.remove('active');
        this.openSettings();
      });
    }

    const currencyBtn = document.getElementById('profileCurrencyBtn');
    if (currencyBtn) {
      currencyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profileMenu')?.classList.remove('active');
        this.openSettings();
      });
    }

    const themeRow = document.getElementById('profileThemeRow');
    if (themeRow) {
      themeRow.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mm_theme', next);
        const toggle = document.getElementById('profileThemeToggle');
        if (toggle) {
          toggle.classList.toggle('dark');
        }
        const menu = document.getElementById('profileMenu');
        if (menu) menu.classList.remove('active');
      });
    }

    this._syncProfileThemeToggle();
  },

  _syncProfileThemeToggle() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const toggle = document.getElementById('profileThemeToggle');
    if (toggle) {
      toggle.classList.toggle('dark', isDark);
    }
  },

  setupNotificationBell() {
    const bell = document.getElementById('notificationBell');
    const badge = document.getElementById('notificationBadge');
    const panel = document.getElementById('notificationPanel');
    if (!bell || !badge || !panel) return;

    this.updateNotificationBadge();

    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = panel.classList.contains('active');
      if (isOpen) {
        panel.classList.remove('active');
      } else {
        this.renderNotificationPanel();
        panel.classList.add('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!bell.contains(e.target) && !panel.contains(e.target)) {
        panel.classList.remove('active');
      }
    });

    const markBtn = document.getElementById('markAllReadBtn');
    if (markBtn) {
      markBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.markAllRead();
      });
    }

    const deleteBtn = document.getElementById('deleteAllNotifBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteAllNotifications();
      });
    }
  },

  restoreSections() {
    try {
      const state = JSON.parse(localStorage.getItem('mm_sidebar_sections') || '{}');
      for (const [name, collapsed] of Object.entries(state)) {
        const content = document.getElementById('section-' + name);
        if (!content) continue;
        const label = content.previousElementSibling;
        const chevron = label ? label.querySelector('.section-chevron') : null;
        if (collapsed) {
          content.classList.add('collapsed');
          if (chevron) chevron.classList.add('collapsed');
        }
      }
    } catch {}
  },

  getNotifications() {
    try {
      return JSON.parse(localStorage.getItem('mm_notifications_list') || '[]');
    } catch { return []; }
  },

  saveNotifications(list) {
    localStorage.setItem('mm_notifications_list', JSON.stringify(list.slice(0, 50)));
  },

  addNotification(type, title, amount, category) {
    const list = this.getNotifications();
    list.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      type,
      title,
      amount: parseFloat(amount),
      category,
      timestamp: Date.now(),
      read: false
    });
    this.saveNotifications(list);
    this.updateNotificationBadge();

    const enabled = localStorage.getItem('mm_notifications') === 'true';
    if (enabled && 'Notification' in window && Notification.permission === 'granted') {
      const prefix = type === 'expense' ? 'spent on' : 'received from';
      const body = Utils.formatCurrency(amount) + ' ' + prefix + ' ' + category + ' \u2014 ' + title;
      new Notification('Fynexo', { body, icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>\uD83C\uDF31</text></svg>' });
    } else if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const list = this.getNotifications();
    const unread = list.filter(n => !n.read).length;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  },

  renderNotificationPanel() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    const notifications = this.getNotifications();

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="notification-empty">
          <i data-lucide="bell" style="width:24px;height:24px;color:var(--text-lighter);margin-bottom:8px"></i>
          <div style="font-size:13px;color:var(--text-lighter)">No notifications yet</div>
          <div style="font-size:11px;color:var(--text-lighter);margin-top:2px">Your transaction alerts will appear here.</div>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const timeAgo = (ts) => {
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return mins + 'm ago';
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + 'h ago';
      const days = Math.floor(hrs / 24);
      return days + 'd ago';
    };

    list.innerHTML = notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}">
        <div class="notification-item-icon ${n.type}">
          <i data-lucide="${n.type === 'expense' ? 'arrow-down-circle' : 'arrow-up-circle'}" style="width:16px;height:16px"></i>
        </div>
        <div class="notification-item-body">
          <div class="notification-item-amount ${n.type}">${n.type === 'expense' ? '-' : '+'}${Utils.formatCurrency(n.amount)}</div>
          <div class="notification-item-desc">${n.title} \u2022 ${n.category}</div>
          <div class="notification-item-time">${timeAgo(n.timestamp)}</div>
        </div>
      </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  markAllRead() {
    const list = this.getNotifications();
    for (const n of list) n.read = true;
    this.saveNotifications(list);
    this.updateNotificationBadge();
    this.renderNotificationPanel();
  },

  deleteAllNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) panel.classList.remove('active');

    const modal = document.getElementById('deleteNotifModal');
    if (!modal) return;
    modal.classList.add('active');

    const confirmBtn = document.getElementById('confirmDeleteNotifBtn');
    const doDelete = () => {
      this.saveNotifications([]);
      this.updateNotificationBadge();
      this.renderNotificationPanel();
      modal.classList.remove('active');
      confirmBtn.removeEventListener('click', doDelete);
    };
    confirmBtn.addEventListener('click', doDelete);
  },

  setupFAB() {
    const fab = document.getElementById('fab');
    const menu = document.getElementById('fabMenu');
    const container = document.getElementById('fabContainer');
    if (!fab || !menu) return;

    const toggleMenu = (force) => {
      const isActive = menu.classList.toggle('active', force === undefined ? !menu.classList.contains('active') : force);
      fab.style.transform = isActive ? 'rotate(45deg)' : 'rotate(0deg)';
    };

    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener('click', (e) => {
      if (container && !container.contains(e.target)) {
        toggleMenu(false);
      }
    });

    menu.querySelectorAll('.fab-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        toggleMenu(false);
        const action = item.dataset.action;
        switch (action) {
          case 'income': openIncomeModal(); break;
          case 'expense': openExpenseModal(); break;
          case 'investment': openInvestmentModal(); break;
          case 'goal': openGoalModal(); break;
        }
      });
    });
  },

  setupHamburger() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!hamburger || !sidebar) return;

    const close = () => {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    };

    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
      overlay.addEventListener('click', close);
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', close);
    });
  },

  setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');
    const layout = document.querySelector('.dashboard-layout');

    if (!toggleBtn || !sidebar || !layout) return;

    toggleBtn.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      layout.classList.toggle('sidebar-collapsed', isCollapsed);
      toggleBtn.title = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

      if (isCollapsed) {
        ['main', 'planning'].forEach(name => {
          const content = document.getElementById('section-' + name);
          if (content && content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            const label = content.previousElementSibling;
            const chevron = label ? label.querySelector('.section-chevron') : null;
            if (chevron) chevron.classList.remove('collapsed');
          }
        });
      }
    });
  },

  setupTooltips() {
    const sidebar = document.getElementById('sidebar');
    const tooltip = document.createElement('div');
    tooltip.className = 'sidebar-tooltip';
    document.body.appendChild(tooltip);

    let hideTimeout;

    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        if (!sidebar.classList.contains('collapsed') || window.innerWidth < 1024) {
          tooltip.classList.remove('visible');
          return;
        }

        const text = item.querySelector('span')?.textContent;
        if (!text) return;

        tooltip.textContent = text;
        clearTimeout(hideTimeout);

        const rect = item.getBoundingClientRect();
        tooltip.style.visibility = 'hidden';
        tooltip.style.display = 'block';
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        tooltip.style.visibility = '';
        tooltip.style.display = '';

        const gap = 12;
        let left = rect.right + gap;
        let top = rect.top + rect.height / 2 - th / 2;
        let onLeft = false;

        if (left + tw > window.innerWidth - 8) {
          left = rect.left - tw - gap;
          onLeft = true;
        }

        top = Math.max(8, Math.min(top, window.innerHeight - th - 8));

        tooltip.classList.toggle('left', onLeft);
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.classList.add('visible');
      });

      item.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
          tooltip.classList.remove('visible');
        }, 80);
      });
    });

    const observer = new MutationObserver(() => {
      if (!sidebar.classList.contains('collapsed')) {
        tooltip.classList.remove('visible');
      }
    });
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  },

  setupSettings() {
    const btn = document.getElementById('sidebarSettingsBtn');
    if (!btn) return;

    btn.addEventListener('click', () => this.openSettings());

    const logoutBtn = document.getElementById('settingsLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
          Auth.logout();
        }
      });
    }

    const resetBtn = document.getElementById('settingsResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAllData());
    }

    const deleteAccountBtn = document.getElementById('settingsDeleteAccountBtn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => this.openDeleteAccountModal());
    }

    const settingsThemeToggle = document.getElementById('settingsThemeToggle');
    if (settingsThemeToggle) {
      settingsThemeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const next = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mm_theme', next);
        settingsThemeToggle.classList.toggle('dark', next === 'dark');

        const navbarToggle = document.getElementById('themeToggle');
        if (navbarToggle) {
          navbarToggle.innerHTML = next === 'dark'
            ? '<i data-lucide="sun" style="width:18px;height:18px"></i>'
            : '<i data-lucide="moon" style="width:18px;height:18px"></i>';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        if (chartInstances && Object.keys(chartInstances).length > 0) {
          if (typeof renderAllCharts === 'function') renderAllCharts();
        }
      });
    }

    const notifToggle = document.getElementById('settingsNotificationsToggle');
    if (notifToggle) {
      const isOn = localStorage.getItem('mm_notifications') === 'true';
      notifToggle.classList.toggle('dark', isOn);
      notifToggle.addEventListener('click', () => {
        const isEnabled = localStorage.getItem('mm_notifications') === 'true';
        const next = !isEnabled;
        localStorage.setItem('mm_notifications', next ? 'true' : 'false');
        notifToggle.classList.toggle('dark', next);
        if (next && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        Toast.success(next ? 'Notifications enabled' : 'Notifications disabled');
      });
    }
  },

  openSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.classList.add('active');

    const currencySelect = document.getElementById('settingsCurrency');
    if (currencySelect) {
      currencySelect.value = Currency.getCurrent().code;
    }

    const themeToggle = document.getElementById('settingsThemeToggle');
    if (themeToggle) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeToggle.classList.toggle('dark', isDark);
    }

    const notifToggle = document.getElementById('settingsNotificationsToggle');
    if (notifToggle) {
      const isOn = localStorage.getItem('mm_notifications') === 'true';
      notifToggle.classList.toggle('dark', isOn);
    }
  },

  closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
  },

  saveSettings() {
    const currencySelect = document.getElementById('settingsCurrency');
    if (currencySelect) {
      Currency.set(currencySelect.value);
      const label = document.getElementById('profileCurrencyLabel');
      if (label) label.textContent = Currency.getCurrent().code;
    }

    this.closeSettings();
    Toast.success('Settings saved successfully!');

    if (typeof renderAllCharts === 'function') renderAllCharts();
    this.renderDashboard();
    if (typeof renderExpenses === 'function') renderExpenses();
    if (typeof renderIncomes === 'function') renderIncomes();
    if (typeof renderBudgets === 'function') renderBudgets();
  },

  async resetAllData() {
    if (!confirm('This will permanently delete ALL your income, expenses, and budgets. This action cannot be undone. Are you sure?')) return;

    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      Storage.remove(`income_${session.email}`);
      Storage.remove(`expenses_${session.email}`);
      Storage.remove('budgets');
    } else {
      const token = Auth.getToken();
      if (token) {
        await Promise.all([
          fetch(`${API_BASE}/api/expenses/all`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/income/all`,{ method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/investments/all`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/goals/all`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        ]);
      }
      Storage.remove('budgets');
    }

    await Expenses.init();
    await Income.init();
    await Investments.init();
    await Goals.init();

    this.closeSettings();
    Toast.success('All data has been reset successfully.');

    this.renderDashboard();
    if (typeof renderIncomes === 'function') renderIncomes();
    if (typeof renderExpenses === 'function') renderExpenses();
    if (typeof renderInvestments === 'function') renderInvestments();
    if (typeof renderAllCharts === 'function') renderAllCharts();
    if (typeof renderBudgets === 'function') renderBudgets();
    if (typeof renderGoals === 'function') renderGoals();
  },

  setupModalClose() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-overlay').classList.remove('active');
      });
    });

    const confirmDeleteBtn = document.getElementById('confirmDeleteAccountBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => this.deleteAccount());
    }
  },

  openDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (!modal) return;
    document.getElementById('deleteAccountPassword').value = '';
    document.getElementById('deleteAccountError').classList.remove('show');
    modal.classList.add('active');
  },

  closeDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.getElementById('deleteAccountError').classList.remove('show');
  },

  async deleteAccount() {
    const password = document.getElementById('deleteAccountPassword').value;
    const errorEl = document.getElementById('deleteAccountError');

    if (!password) {
      errorEl.textContent = 'Please enter your password.';
      errorEl.classList.add('show');
      return;
    }

    const result = await Auth.deleteAccount(password);
    if (result.success) {
      const isGuest = localStorage.getItem('mm_is_guest') === 'true';
      if (isGuest) {
        localStorage.removeItem('mm_is_guest');
        localStorage.removeItem('mm_session');
      }
      localStorage.clear();
      window.location.href = 'login.html';
    } else {
      errorEl.textContent = result.error;
      errorEl.classList.add('show');
    }
  },

  setupHistoryListeners() {
    const search = document.getElementById('historySearch');
    const filter = document.getElementById('historyTypeFilter');

    const handler = () => this.renderTransactionHistory();

    if (search) search.addEventListener('input', handler);
    if (filter) filter.addEventListener('change', handler);

    const exportBtn = document.getElementById('exportCSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const txns = [
          ...Income.getAll().map(i => ({ Title: i.title, Amount: i.amount, Category: i.category, Date: i.date, Type: 'Income' })),
          ...Expenses.getAll().map(e => ({ Title: e.title, Amount: e.amount, Category: e.category, Date: e.date, Type: 'Expense' })),
          ...Investments.getAll().map(i => ({ Title: i.investmentName || i.title, Amount: i.amount, Category: i.type || i.category, Date: i.date, Type: 'Investment' }))
        ];
        exportCSV(txns, 'transactions');
      });
    }

    const pdfBtn = document.getElementById('exportPDF');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        exportPDF('Fynexo-Transactions');
      });
    }

    const reportBtn = document.getElementById('generateReportBtn');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        exportPDF('Fynexo-Financial-Report');
      });
    }
  }
};

function updateDashboardSummary() {
  App.updateNavbarBalance();
  if (App.currentTab === 'dashboard') {
    App.renderDashboard();
  }
}

function renderBudgets() {
  const container = document.getElementById('budgetsContainer');
  if (!container) return;

  let budgets = Storage.get('budgets', {});

  const byCategory = Expenses.getByMonth(Utils.getCurrentMonth());
  const spent = {};
  byCategory.forEach(e => {
    spent[e.category] = (spent[e.category] || 0) + e.amount;
  });

  const defaultCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Others'];
  const hasBudgets = Object.keys(budgets).length > 0;

  if (!hasBudgets) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px">
        <i data-lucide="target" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No budgets set</h3>
        <p>Set monthly budgets to track your spending limits.</p>
        <button class="btn btn-primary btn-sm mt-4" onclick="openBudgetModal()">Set Budget</button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  const categoryIcons = {
    Food: 'utensils-crossed', Travel: 'plane', Shopping: 'shopping-bag',
    Bills: 'receipt', Entertainment: 'clapperboard', Others: 'more-horizontal'
  };

  let html = '';
  for (const cat of defaultCategories) {
    const limit = budgets[cat];
    if (!limit) continue;
    const totalSpent = spent[cat] || 0;
    const percent = Math.min((totalSpent / limit) * 100, 100);
    const isOver = totalSpent > limit;
    const remaining = Math.max(limit - totalSpent, 0);
    const catColor = Utils.getCategoryColor(cat);

    const ringColor = isOver ? '#ef4444' : percent >= 90 ? '#ef4444' : percent >= 70 ? '#f59e0b' : '#10b981';
    const circ = 2 * Math.PI * 40;
    const offset = circ - (percent / 100) * circ;

    html += `
      <div class="card budget-card">
        <div style="display:flex;align-items:center;gap:16px;padding:16px">
          <div style="position:relative;width:90px;height:90px;flex-shrink:0">
            <svg width="90" height="90" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r="40" fill="none" stroke="var(--border)" stroke-width="8"/>
              <circle cx="54" cy="54" r="40" fill="none" stroke="${ringColor}" stroke-width="8"
                stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                stroke-linecap="round" transform="rotate(-90,54,54)"
                style="transition: stroke-dashoffset 0.8s ease"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <span style="font-size:11px;color:var(--text-lighter)">${percent.toFixed(0)}%</span>
            </div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <i data-lucide="${categoryIcons[cat] || 'circle'}" style="width:16px;height:16px;color:${catColor}"></i>
              <span class="budget-category">${cat}</span>
              ${isOver ? '<span class="badge badge-red">Exceeded</span>' : percent >= 90 ? '<span class="badge badge-yellow">Almost full</span>' : ''}
            </div>
            <div style="font-size:13px;color:var(--text)">${Utils.formatCurrency(totalSpent)} <span style="color:var(--text-lighter)">/ ${Utils.formatCurrency(limit)}</span></div>
            <div style="font-size:12px;margin-top:2px;color:${isOver ? 'var(--danger)' : 'var(--primary)'}">
              ${isOver ? `<span style="color:var(--danger)">⚠ Exceeded by ${Utils.formatCurrency(totalSpent - limit)}</span>` : `${Utils.formatCurrency(remaining)} remaining`}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (!html) {
    html = `
      <div class="empty-state" style="padding:40px">
        <i data-lucide="target" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No budgets set</h3>
        <p>Set monthly budgets to track your spending limits.</p>
        <button class="btn btn-primary btn-sm mt-4" onclick="openBudgetModal()">Set Budget</button>
      </div>
    `;
  }

  container.innerHTML = html + `
    <div style="text-align:center;margin-top:16px">
      <button class="btn btn-outline btn-sm" onclick="openBudgetModal()">Manage Budgets</button>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openBudgetModal() {
  const modal = document.getElementById('budgetModal');
  if (!modal) return;
  modal.classList.add('active');

  const budgets = Storage.get('budgets', {});
  const container = document.getElementById('budgetFormContainer');

  const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Others'];
  container.innerHTML = categories.map(cat => `
    <div class="form-group">
      <label class="form-label">${cat}</label>
      <input class="form-input" type="number" id="budget_${cat}" placeholder="Monthly limit" value="${budgets[cat] || ''}" min="0" step="0.01">
    </div>
  `).join('');
}

function saveBudgets() {
  const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Others'];
  const budgets = {};
  let hasAny = false;

  for (const cat of categories) {
    const el = document.getElementById(`budget_${cat}`);
    if (el && el.value && parseFloat(el.value) > 0) {
      budgets[cat] = parseFloat(el.value);
      hasAny = true;
    }
  }

  Storage.set('budgets', budgets);
  Toast.success(hasAny ? 'Budgets saved successfully!' : 'All budgets removed.');
  document.getElementById('budgetModal')?.classList.remove('active');
  renderBudgets();

  if (typeof updateDashboardSummary === 'function') updateDashboardSummary();
}

function toggleSection(name) {
  const content = document.getElementById('section-' + name);
  if (!content) return;
  const isCollapsed = content.classList.toggle('collapsed');
  const label = content.previousElementSibling;
  const chevron = label ? label.querySelector('.section-chevron') : null;
  if (chevron) chevron.classList.toggle('collapsed', isCollapsed);
  try {
    const state = JSON.parse(localStorage.getItem('mm_sidebar_sections') || '{}');
    state[name] = isCollapsed;
    localStorage.setItem('mm_sidebar_sections', JSON.stringify(state));
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.setupHistoryListeners();
});





