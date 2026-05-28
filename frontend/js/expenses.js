const Expenses = {
  _cache: [],

  async init() {
    await this._sync();
  },

  async _sync() {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      this._cache = Storage.get(`expenses_${session.email}`, []);
      return;
    }
    try {
      const token = Auth.getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/expenses`, {
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

  async add(data) {
    const expense = {
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
      const expenses = Storage.get(`expenses_${session.email}`, []);
      expenses.push(expense);
      Storage.set(`expenses_${session.email}`, expenses);
      await this._sync();
      return expense;
    }

    const token = Auth.getToken();
    if (token) {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: data.title, amount: data.amount, category: data.category, date: data.date })
      });
      if (res.ok) await this._sync();
    }
    return expense;
  },

  async update(id, data) {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      const expenses = Storage.get(`expenses_${session.email}`, []);
      const index = expenses.findIndex(e => e.id === id);
      if (index !== -1) {
        expenses[index] = { ...expenses[index], ...data, amount: parseFloat(data.amount) };
        Storage.set(`expenses_${session.email}`, expenses);
      }
      await this._sync();
      return;
    }

    const token = Auth.getToken();
    if (token) {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) await this._sync();
    }
  },

  delete(id) {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      const expenses = Storage.get(`expenses_${session.email}`, []);
      Storage.set(`expenses_${session.email}`, expenses.filter(e => e.id !== id));
      this._sync();
      return;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.ok) this._sync();
      });
    }
  },

  getTotal() {
    return this.getAll().reduce((sum, e) => sum + e.amount, 0);
  },

  getCurrentMonthTotal() {
    return this.getByMonth(Utils.getCurrentMonth()).reduce((sum, e) => sum + e.amount, 0);
  },

  getByMonth(month) {
    return this.getAll().filter(e => Utils.getMonthFromDate(e.date) === month);
  },

  getCurrentMonthExpenses() {
    return this.getByMonth(Utils.getCurrentMonth());
  },

  getByCategory() {
    const byCategory = {};
    this.getAll().forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
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
    this.getAll().forEach(e => {
      const month = Utils.getMonthFromDate(e.date);
      monthly[month] = (monthly[month] || 0) + e.amount;
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

let expenseEditId = null;

function renderExpenses(filter = 'all', search = '') {
  const tbody = document.getElementById('expenseTableBody');
  if (!tbody) return;

  let expenses = Expenses.getAll();

  if (filter !== 'all') {
    expenses = expenses.filter(e => e.category === filter);
  }

  if (search) {
    const s = search.toLowerCase();
    expenses = expenses.filter(e => e.title.toLowerCase().includes(s));
  }

  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!expenses.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i data-lucide="wallet" class="empty-state-icon" style="width:48px;height:48px"></i>
            <h3>No expenses found</h3>
            <p>Add your first expense to start tracking.</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>
        <span class="expense-title">${e.title}</span>
      </td>
      <td>${Utils.formatCurrency(e.amount)}</td>
      <td>
        <span class="badge badge-${getBadgeType(e.category)}">${e.category}</span>
      </td>
      <td>${Utils.formatDate(e.date)}</td>
      <td>
        <span class="transaction-amount negative">-${Utils.formatCurrency(e.amount)}</span>
      </td>
      <td>
        <div class="actions">
          <button onclick="editExpense('${e.id}')" title="Edit">
            <i data-lucide="pencil" style="width:16px;height:16px"></i>
          </button>
          <button class="delete" onclick="deleteExpense('${e.id}')" title="Delete">
            <i data-lucide="trash-2" style="width:16px;height:16px"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
  updateExpenseSummary();
}

function getBadgeType(category) {
  const map = {
    'Food': 'green', 'Travel': 'blue', 'Shopping': 'purple',
    'Bills': 'yellow', 'Entertainment': 'orange', 'Others': 'blue'
  };
  return map[category] || 'blue';
}

function updateExpenseSummary() {
  const total = Expenses.getCurrentMonthTotal();
  const el = document.getElementById('currentMonthExpenses');
  if (el) el.textContent = Utils.formatCurrency(total);
}

function openExpenseModal(data = null) {
  const modal = document.getElementById('expenseModal');
  if (!modal) return;
  modal.classList.add('active');

  const titleEl = document.getElementById('expenseModalTitle');
  const nameEl = document.getElementById('expenseName');
  const amountEl = document.getElementById('expenseAmount');
  const categoryEl = document.getElementById('expenseCategory');
  const dateEl = document.getElementById('expenseDate');
  const submitBtn = document.getElementById('expenseSubmitBtn');

  if (data) {
    expenseEditId = data.id;
    titleEl.textContent = 'Edit Expense';
    nameEl.value = data.title;
    amountEl.value = data.amount;
    categoryEl.value = data.category;
    dateEl.value = data.date;
    submitBtn.textContent = 'Update Expense';
  } else {
    expenseEditId = null;
    titleEl.textContent = 'Add Expense';
    nameEl.value = '';
    amountEl.value = '';
    categoryEl.value = 'Food';
    dateEl.value = new Date().toISOString().split('T')[0];
    submitBtn.textContent = 'Add Expense';
  }
}

function closeExpenseModal() {
  const modal = document.getElementById('expenseModal');
  if (modal) modal.classList.remove('active');
}

async function saveExpense() {
  const name = document.getElementById('expenseName').value.trim();
  const amount = document.getElementById('expenseAmount').value;
  const category = document.getElementById('expenseCategory').value;
  const date = document.getElementById('expenseDate').value;

  if (!name || !amount || parseFloat(amount) <= 0) {
    Toast.error('Please fill in all fields with valid values.');
    return;
  }

  if (expenseEditId) {
    await Expenses.update(expenseEditId, { title: name, amount, category, date });
    Toast.success('Expense updated successfully!');
  } else {
    await Expenses.add({ title: name, amount, category, date });
    Toast.success('Expense added successfully!');
    App.addNotification('expense', name, amount, category);
  }

  closeExpenseModal();
  renderExpenses();
  updateDashboardSummary();
  if (typeof renderAllCharts === 'function') renderAllCharts();
  if (typeof renderBudgets === 'function') renderBudgets();
}

function editExpense(id) {
  const expenses = Expenses.getAll();
  const expense = expenses.find(e => e.id === id);
  if (expense) openExpenseModal(expense);
}

function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) return;
  Expenses.delete(id);
  Toast.success('Expense deleted.');
  setTimeout(() => {
    renderExpenses();
    updateDashboardSummary();
    if (typeof renderAllCharts === 'function') renderAllCharts();
    if (typeof renderBudgets === 'function') renderBudgets();
  }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  const expenseFilter = document.getElementById('expenseFilter');
  const expenseSearch = document.getElementById('expenseSearch');

  if (expenseFilter) {
    expenseFilter.addEventListener('change', () => {
      renderExpenses(expenseFilter.value, expenseSearch?.value || '');
    });
  }

  if (expenseSearch) {
    expenseSearch.addEventListener('input', () => {
      renderExpenses(expenseFilter?.value || 'all', expenseSearch.value);
    });
  }
});

