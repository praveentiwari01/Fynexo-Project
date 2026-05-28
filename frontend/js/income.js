const API_BASE = 'https://moneymint-project.onrender.com';
const Income = {
  _cache: [],

  async init() {
    await this._sync();
  },

  async _sync() {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      this._cache = Storage.get(`income_${session.email}`, []);
      return;
    }
    try {
      const token = Auth.getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/income`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this._cache = await res.json();
      }
    } catch {
      this._cache = [];
    }
  },

  getAll() {
    return this._cache;
  },

  add(data) {
    const entry = {
      id: Utils.generateId(),
      title: data.title,
      amount: parseFloat(data.amount),
      category: data.category,
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      const income = Storage.get(`income_${session.email}`, []);
      income.push(entry);
      Storage.set(`income_${session.email}`, income);
      this._sync();
      return entry;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: data.title, amount: data.amount, category: data.category, date: data.date })
      }).then(res => {
        if (res.ok) this._sync();
      });
    }
    return entry;
  },

  update(id, data) {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      const income = Storage.get(`income_${session.email}`, []);
      const index = income.findIndex(i => i.id === id);
      if (index !== -1) {
        income[index] = { ...income[index], ...data, amount: parseFloat(data.amount) };
        Storage.set(`income_${session.email}`, income);
      }
      this._sync();
      return;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/income/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      }).then(res => {
        if (res.ok) this._sync();
      });
    }
  },

  delete(id) {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      const income = Storage.get(`income_${session.email}`, []);
      Storage.set(`income_${session.email}`, income.filter(i => i.id !== id));
      this._sync();
      return;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/income/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.ok) this._sync();
      });
    }
  },

  getTotal() {
    return this.getAll().reduce((sum, i) => sum + i.amount, 0);
  },

  getCurrentMonthTotal() {
    return this.getByMonth(Utils.getCurrentMonth()).reduce((sum, i) => sum + i.amount, 0);
  },

  getByMonth(month) {
    return this.getAll().filter(i => Utils.getMonthFromDate(i.date) === month);
  },

  getByCategory() {
    const byCategory = {};
    this.getAll().forEach(i => {
      byCategory[i.category] = (byCategory[i.category] || 0) + i.amount;
    });
    return byCategory;
  },

  getRecent(limit = 5) {
    return this.getAll()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },

  getMonthlyTotals() {
    const monthly = {};
    this.getAll().forEach(i => {
      const month = Utils.getMonthFromDate(i.date);
      monthly[month] = (monthly[month] || 0) + i.amount;
    });
    return monthly;
  },

  getLast6Months() {
    const monthly = this.getMonthlyTotals();
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: Utils.getMonthName(d.getMonth()), amount: monthly[key] || 0 });
    }
    return result;
  }
};

let incomeEditId = null;

function renderIncomes() {
  const tbody = document.getElementById('incomeTableBody');
  if (!tbody) return;

  const incomes = Income.getAll().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!incomes.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i data-lucide="wallet" class="empty-state-icon" style="width:48px;height:48px"></i>
            <h3>No income entries yet</h3>
            <p>Add your income sources to track your earnings.</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  tbody.innerHTML = incomes.map(i => `
    <tr>
      <td>
        <span class="expense-title">${i.title}</span>
      </td>
      <td>${Utils.formatCurrency(i.amount)}</td>
      <td>
        <span class="badge badge-${getIncomeBadgeType(i.category)}">${i.category}</span>
      </td>
      <td>${Utils.formatDate(i.date)}</td>
      <td>
        <span class="transaction-amount positive">${Utils.formatCurrency(i.amount)}</span>
      </td>
      <td>
        <div class="actions">
          <button onclick="editIncome('${i.id}')" title="Edit">
            <i data-lucide="pencil" style="width:16px;height:16px"></i>
          </button>
          <button class="delete" onclick="deleteIncome('${i.id}')" title="Delete">
            <i data-lucide="trash-2" style="width:16px;height:16px"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
  updateIncomeSummary();
}

function getIncomeBadgeType(category) {
  const map = {
    'Salary': 'green', 'Freelance': 'blue', 'Business': 'purple',
    'Investment Returns': 'yellow', 'Other': 'blue'
  };
  return map[category] || 'blue';
}

function updateIncomeSummary() {
  const total = Income.getCurrentMonthTotal();
  const el = document.getElementById('currentMonthIncome');
  if (el) el.textContent = Utils.formatCurrency(total);
}

function openIncomeModal(data = null) {
  const modal = document.getElementById('incomeModal');
  if (!modal) return;
  modal.classList.add('active');

  const titleEl = document.getElementById('incomeModalTitle');
  const nameEl = document.getElementById('incomeName');
  const amountEl = document.getElementById('incomeAmount');
  const categoryEl = document.getElementById('incomeCategory');
  const dateEl = document.getElementById('incomeDate');
  const submitBtn = document.getElementById('incomeSubmitBtn');

  if (data) {
    incomeEditId = data.id;
    titleEl.textContent = 'Edit Income';
    nameEl.value = data.title;
    amountEl.value = data.amount;
    categoryEl.value = data.category;
    dateEl.value = data.date;
    submitBtn.textContent = 'Update Income';
  } else {
    incomeEditId = null;
    titleEl.textContent = 'Add Income';
    nameEl.value = '';
    amountEl.value = '';
    categoryEl.value = 'Salary';
    dateEl.value = new Date().toISOString().split('T')[0];
    submitBtn.textContent = 'Add Income';
  }
}

function closeIncomeModal() {
  const modal = document.getElementById('incomeModal');
  if (modal) modal.classList.remove('active');
}

function saveIncome() {
  const name = document.getElementById('incomeName').value.trim();
  const amount = document.getElementById('incomeAmount').value;
  const category = document.getElementById('incomeCategory').value;
  const date = document.getElementById('incomeDate').value;

  if (!name || !amount || parseFloat(amount) <= 0) {
    Toast.error('Please fill in all fields with valid values.');
    return;
  }

  if (incomeEditId) {
    Income.update(incomeEditId, { title: name, amount, category, date });
    Toast.success('Income updated successfully!');
  } else {
    Income.add({ title: name, amount, category, date });
    Toast.success('Income added successfully!');
    App.addNotification('income', name, amount, category);
  }

  closeIncomeModal();
  setTimeout(() => {
    renderIncomes();
    updateDashboardSummary();
    if (typeof renderAllCharts === 'function') renderAllCharts();
  }, 200);
}

function editIncome(id) {
  const incomes = Income.getAll();
  const entry = incomes.find(i => i.id === id);
  if (entry) openIncomeModal(entry);
}

function deleteIncome(id) {
  if (!confirm('Are you sure you want to delete this income entry?')) return;
  Income.delete(id);
  Toast.success('Income entry deleted.');
  setTimeout(() => {
    renderIncomes();
    updateDashboardSummary();
    if (typeof renderAllCharts === 'function') renderAllCharts();
  }, 200);
}

