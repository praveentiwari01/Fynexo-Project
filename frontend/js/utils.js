const Currency = {
  list: [
    { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
    { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
    { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'CA$', locale: 'en-CA', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'AU$', locale: 'en-AU', name: 'Australian Dollar' },
    { code: 'BRL', symbol: 'R$', locale: 'pt-BR', name: 'Brazilian Real' },
    { code: 'CHF', symbol: 'CHF', locale: 'de-CH', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan' },
    { code: 'KRW', symbol: '₩', locale: 'ko-KR', name: 'South Korean Won' },
    { code: 'MXN', symbol: 'MX$', locale: 'es-MX', name: 'Mexican Peso' }
  ],

  getCurrent() {
    const saved = localStorage.getItem('mm_currency');
    if (saved) return this.list.find(c => c.code === saved) || this.list[0];
    return this.list[0];
  },

  set(code) {
    localStorage.setItem('mm_currency', code);
  },

  format(amount) {
    const currency = this.getCurrent();
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return currency.symbol + amount.toFixed(2);
    }
  },

  getSymbol() {
    return this.getCurrent().symbol;
  },

  getCode() {
    return this.getCurrent().code;
  }
};

const Utils = {
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  formatCurrency(amount) {
    return Currency.format(amount);
  },

  formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatMonthYear(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  },

  getMonthName(monthIndex) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  },

  getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  isCurrentMonth(dateString) {
    const d = new Date(dateString);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  },

  getMonthFromDate(dateString) {
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  truncate(str, len = 20) {
    return str.length > len ? str.substring(0, len) + '...' : str;
  },

  getCategoryIcon(category) {
    const icons = {
      'Food': 'utensils-crossed',
      'Travel': 'plane',
      'Shopping': 'shopping-bag',
      'Bills': 'receipt',
      'Entertainment': 'clapperboard',
      'Others': 'more-horizontal',
      'Stocks': 'trending-up',
      'Mutual Funds': 'bar-chart-3',
      'Crypto': 'bitcoin',
      'Gold': 'circle-dollar-sign',
      'SIP': 'repeat',
      'Fixed Deposit': 'landmark'
    };
    return icons[category] || 'circle';
  },

  getCategoryColor(category) {
    const colors = {
      'Food': '#ef4444',
      'Travel': '#3b82f6',
      'Shopping': '#8b5cf6',
      'Bills': '#f59e0b',
      'Entertainment': '#ec4899',
      'Others': '#94a3b8',
      'Stocks': '#3b82f6',
      'Mutual Funds': '#8b5cf6',
      'Crypto': '#f59e0b',
      'Gold': '#f59e0b',
      'SIP': '#10b981',
      'Fixed Deposit': '#6366f1'
    };
    return colors[category] || '#94a3b8';
  }
};

const Storage = {
  _prefix: 'mm_',

  get(key, def = null) {
    try {
      const data = localStorage.getItem(this._prefix + key);
      return data ? JSON.parse(data) : def;
    } catch { return def; }
  },

  set(key, value) {
    localStorage.setItem(this._prefix + key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(this._prefix + key);
  }
};

const Toast = {
  _container: null,

  _ensureContainer() {
    if (!this._container) {
      this._container = document.querySelector('.toast-container');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.className = 'toast-container';
        document.body.appendChild(this._container);
      }
    }
    return this._container;
  },

  show(message, type = 'info', duration = 3500) {
    const container = this._ensureContainer();
    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type] || icons.info}" class="toast-icon" style="width:20px;height:20px"></i>
      <span class="toast-message">${message}</span>
      <i data-lucide="x" class="toast-close" style="width:16px;height:16px"></i>
    `;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  dismiss(toast) {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  },

  success(msg) { return this.show(msg, 'success'); },
  error(msg) { return this.show(msg, 'error'); },
  warning(msg) { return this.show(msg, 'warning'); },
  info(msg) { return this.show(msg, 'info'); }
};

function exportCSV(data, filename) {
  if (!data.length) {
    Toast.warning('No data to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h] || '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  Toast.success('CSV exported successfully!');
}

async function exportPDF(title = 'report') {
  if (typeof html2pdf === 'undefined') {
    Toast.error('PDF library not loaded. Please check your internet connection.');
    return;
  }

  Toast.info('Generating PDF report...');

  const reportEl = document.createElement('div');
  reportEl.style.cssText = 'padding:40px;font-family:Inter,sans-serif;max-width:800px;margin:0 auto';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bgColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  reportEl.style.background = bgColor;
  reportEl.style.color = textColor;

  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  reportEl.innerHTML = `
    <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #2ecc71;padding-bottom:20px">
      <h1 style="color:#2ecc71;margin:0;font-size:28px">MoneyMint</h1>
      <p style="color:#94a3b8;margin:4px 0 0">Smart Finance, Simple Living</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:8px">Report generated: ${reportDate}</p>
    </div>
    <div style="margin-bottom:24px">
      <h2 style="font-size:18px;margin:0 0 12px">Financial Summary</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:rgba(46,204,113,0.1);padding:16px;border-radius:8px;border-left:4px solid #2ecc71">
          <div style="font-size:12px;color:#94a3b8">Total Income</div>
          <div style="font-size:22px;font-weight:700;color:#2ecc71">${Utils.formatCurrency(Income.getTotal())}</div>
        </div>
        <div style="background:rgba(239,68,68,0.1);padding:16px;border-radius:8px;border-left:4px solid #ef4444">
          <div style="font-size:12px;color:#94a3b8">Total Expenses</div>
          <div style="font-size:22px;font-weight:700;color:#ef4444">${Utils.formatCurrency(Expenses.getTotal())}</div>
        </div>
        <div style="background:rgba(59,130,246,0.1);padding:16px;border-radius:8px;border-left:4px solid #3b82f6">
          <div style="font-size:12px;color:#94a3b8">Total Investments</div>
          <div style="font-size:22px;font-weight:700;color:#3b82f6">${Utils.formatCurrency(Investments.getTotal())}</div>
        </div>
        <div style="background:rgba(245,158,11,0.1);padding:16px;border-radius:8px;border-left:4px solid #f59e0b">
          <div style="font-size:12px;color:#94a3b8">Total Savings</div>
          <div style="font-size:22px;font-weight:700;color:#f59e0b">${Utils.formatCurrency(Math.max(Income.getTotal() - Expenses.getTotal(), 0))}</div>
        </div>
      </div>
    </div>
  `;

  const allTxns = [
    ...Income.getAll().map(i => ({ ...i, txnType: 'Income' })),
    ...Expenses.getAll().map(e => ({ ...e, txnType: 'Expense' })),
    ...Investments.getAll().map(i => ({ ...i, title: i.investmentName || i.title, category: i.type || i.category, txnType: 'Investment' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allTxns.length > 0) {
    let tableRows = allTxns.slice(0, 20).map(t => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px">${t.title}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px">${t.category || '-'}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px">${Utils.formatDate(t.date)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600">${Utils.formatCurrency(t.amount)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px">${t.txnType}</td>
      </tr>
    `).join('');

    reportEl.innerHTML += `
      <div style="margin-bottom:24px">
        <h2 style="font-size:18px;margin:0 0 12px">Recent Transactions (Last 20)</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:rgba(46,204,113,0.1)">
              <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase">Title</th>
              <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase">Category</th>
              <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase">Date</th>
              <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase">Amount</th>
              <th style="padding:8px;text-align:left;font-size:11px;text-transform:uppercase">Type</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;
  }

  reportEl.innerHTML += `
    <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
      Generated by MoneyMint — Personal Finance Manager
    </div>
  `;

  try {
    await html2pdf().set({
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${title}-${new Date().toISOString().split('T')[0]}.pdf`,
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(reportEl).save();
    Toast.success('PDF exported successfully!');
  } catch (err) {
    Toast.error('PDF generation failed. Please try again.');
  }
}

function resizeImage(file, maxW, maxH, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        if (h > maxH) { w = w * maxH / h; h = maxH; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality || 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
