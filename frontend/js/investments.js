const Investments = {
  _cache: [],

  async init() {
    await this._sync();
  },

  async _sync() {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      this._cache = Storage.get(`investments_${session.email}`, []);
      return;
    }
    try {
      const token = Auth.getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/investments`, {
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
      investmentName: data.investmentName,
      amount: parseFloat(data.amount),
      type: data.type,
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      const investments = Storage.get(`investments_${session.email}`, []);
      investments.push(entry);
      Storage.set(`investments_${session.email}`, investments);
      this._sync();
      return entry;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ investmentName: data.investmentName, amount: data.amount, type: data.type, date: data.date })
      }).then(res => {
        if (res.ok) this._sync();
      });
    }
    return entry;
  },

  delete(id) {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const session = JSON.parse(localStorage.getItem('mm_session') || '{}');
      const investments = Storage.get(`investments_${session.email}`, []);
      Storage.set(`investments_${session.email}`, investments.filter(i => i.id !== id));
      this._sync();
      return;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/investments/${id}`, {
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

  getByType() {
    const byType = {};
    this.getAll().forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + i.amount;
    });
    return byType;
  },

  getMonthlyTotals() {
    const monthly = {};
    this.getAll().forEach(i => {
      const month = Utils.getMonthFromDate(i.date);
      monthly[month] = (monthly[month] || 0) + i.amount;
    });
    return monthly;
  },

  getMonths(count = 6) {
    const monthly = this.getMonthlyTotals();
    const result = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: Utils.getMonthName(d.getMonth()), key, amount: monthly[key] || 0 });
    }
    return result;
  },

  getLast6Months() {
    return this.getMonths(6);
  }
};

function renderInvestments(filter = 'all', search = '') {
  const tbody = document.getElementById('investmentTableBody');
  if (!tbody) return;

  let investments = Investments.getAll();

  if (filter !== 'all') {
    investments = investments.filter(i => i.type === filter);
  }

  if (search) {
    const s = search.toLowerCase();
    investments = investments.filter(i =>
      i.investmentName.toLowerCase().includes(s) ||
      (i.type || '').toLowerCase().includes(s)
    );
  }

  investments.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!investments.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <i data-lucide="trending-up" class="empty-state-icon" style="width:48px;height:48px"></i>
            <h3>No investments yet</h3>
            <p>Add your first investment to start tracking.</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  const catClass = (cat) => {
    const m = {
      'food':'food','travel':'travel','transport':'transport','shopping':'shopping',
      'health':'health','entertainment':'entertainment','education':'education',
      'investment':'investment','salary':'salary','freelance':'freelance','bills':'bills',
      'others':'others','other':'other','stocks':'stocks','mutual funds':'mutual',
      'crypto':'crypto','gold':'gold','sip':'sip','fixed deposit':'fixed'
    };
    return m[(cat||'').toLowerCase()] || 'others';
  };

  tbody.innerHTML = investments.map(i => `
    <tr>
      <td class="col-title" data-label="Name">
        <span style="margin-right:8px">${i.investmentName}</span>
        <span class="cat-badge ${catClass(i.type)}">${i.type}</span>
      </td>
      <td class="col-amount" data-label="Amount"><span class="inv">${Utils.formatCurrency(i.amount)}</span></td>
      <td class="col-date" data-label="Date">${Utils.formatDate(i.date)}</td>
      <td class="col-amount" data-label="Value"><span class="inv">${Utils.formatCurrency(i.amount)}</span></td>
      <td class="col-actions" data-label="Actions">
        <div class="actions" style="justify-content:center">
          <button class="delete" onclick="deleteInvestment('${i.id}')" title="Delete">
            <i data-lucide="trash-2" style="width:16px;height:16px"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
  updateInvestmentSummary();
}

function updateInvestmentSummary() {
  const total = Investments.getTotal();
  const el = document.getElementById('currentMonthInvestments');
  if (el) el.textContent = Utils.formatCurrency(total);
}

function openInvestmentModal() {
  const modal = document.getElementById('investmentModal');
  if (!modal) return;
  modal.classList.add('active');

  document.getElementById('investmentName').value = '';
  document.getElementById('investmentAmount').value = '';
  document.getElementById('investmentType').value = 'Stocks';
  document.getElementById('investmentDate').value = new Date().toISOString().split('T')[0];
}

function closeInvestmentModal() {
  const modal = document.getElementById('investmentModal');
  if (modal) modal.classList.remove('active');
}

function saveInvestment() {
  const name = document.getElementById('investmentName').value.trim();
  const amount = document.getElementById('investmentAmount').value;
  const type = document.getElementById('investmentType').value;
  const date = document.getElementById('investmentDate').value;

  if (!name || !amount || parseFloat(amount) <= 0) {
    Toast.error('Please fill in all fields with valid values.');
    return;
  }

  Investments.add({ investmentName: name, amount, type, date });
  Toast.success('Investment added successfully!');

  closeInvestmentModal();
  setTimeout(() => {
    renderInvestments();
    updateDashboardSummary();
    if (typeof renderAllCharts === 'function') renderAllCharts();
  }, 200);
}

function deleteInvestment(id) {
  if (!confirm('Are you sure you want to delete this investment?')) return;
  Investments.delete(id);
  Toast.success('Investment deleted.');
  setTimeout(() => {
    renderInvestments();
    updateDashboardSummary();
    if (typeof renderAllCharts === 'function') renderAllCharts();
  }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  const investmentFilter = document.getElementById('investmentFilter');
  const investmentSearch = document.getElementById('investmentSearch');

  if (investmentFilter) {
    investmentFilter.addEventListener('change', () => {
      renderInvestments(investmentFilter.value, investmentSearch?.value || '');
    });
  }

  if (investmentSearch) {
    investmentSearch.addEventListener('input', () => {
      renderInvestments(investmentFilter?.value || 'all', investmentSearch.value);
    });
  }
});
