const chartInstances = {};
let selectedMonthRange = 6;

function _setChartEmptyState(canvas, html) {
  const container = canvas.parentElement;
  let emptyEl = container.querySelector('.chart-empty-state');
  if (!emptyEl) {
    emptyEl = document.createElement('div');
    emptyEl.className = 'chart-empty-state';
    container.appendChild(emptyEl);
  }
  emptyEl.innerHTML = html;
  emptyEl.style.display = 'flex';
  canvas.style.display = 'none';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function _clearChartEmptyState(canvas) {
  const container = canvas.parentElement;
  const emptyEl = container.querySelector('.chart-empty-state');
  if (emptyEl) emptyEl.style.display = 'none';
  canvas.style.display = 'block';
}

function getChartDefaults() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    color: isDark ? '#94a3b8' : '#64748b',
    gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    fontFamily: "'Inter', sans-serif"
  };
}

function destroyChart(key) {
  if (chartInstances[key]) {
    chartInstances[key].destroy();
    delete chartInstances[key];
  }
}

function createPieChart(canvasId = 'expensePieChart', chartKey = 'pieChart') {
  destroyChart(chartKey);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const byCategory = Expenses.getByCategory();
  const defaults = getChartDefaults();
  const categories = Object.keys(byCategory);

  if (!categories.length) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="pie-chart" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No data yet</h3>
        <p>Add expenses to see the breakdown.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  const colors = categories.map(c => Utils.getCategoryColor(c));

  chartInstances[chartKey] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        data: categories.map(c => byCategory[c]),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: defaults.color
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 12 },
            padding: 16,
            usePointStyle: true
          }
        }
      }
    }
  });
}

function createBarChart(canvasId = 'monthlyBarChart', chartKey = 'barChart', monthCount = 6) {
  destroyChart(chartKey);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const monthlyData = Expenses.getMonths(monthCount);
  const defaults = getChartDefaults();

  const hasData = monthlyData.some(d => d.amount > 0);
  if (!hasData) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="bar-chart-3" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No data available</h3>
        <p>Add expenses to see your monthly spending overview.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  chartInstances[chartKey] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Expenses',
        data: monthlyData.map(d => d.amount),
        backgroundColor: 'rgba(46, 204, 113, 0.6)',
        borderColor: '#2ecc71',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: defaults.color,
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: ctx => Currency.getSymbol() + ctx.parsed.y.toLocaleString()
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: defaults.gridColor },
          ticks: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 11 },
            callback: v => Currency.getSymbol() + v.toLocaleString()
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 11 }
          }
        }
      }
    }
  });
}

function createWeeklyBarChart() {
  destroyChart('weeklyBarChart');
  const canvas = document.getElementById('weeklySpendingChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const weeklyData = Expenses.getWeeklyTotals();
  const defaults = getChartDefaults();

  const hasData = weeklyData.some(d => d.amount > 0);
  if (!hasData) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="bar-chart-3" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No data yet</h3>
        <p>Add expenses to see weekly trends.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  chartInstances.weeklyBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeklyData.map(d => d.label),
      datasets: [{
        label: 'Spending',
        data: weeklyData.map(d => d.amount),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => Currency.getSymbol() + ctx.parsed.y.toLocaleString() }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: defaults.gridColor },
          ticks: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 11 },
            callback: v => Currency.getSymbol() + v.toLocaleString()
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: defaults.color, font: { family: defaults.fontFamily, size: 10 } }
        }
      }
    }
  });
}

function createIncomeVsExpenseChart(canvasId = 'incomeVsExpenseChart', chartKey = 'incomeVsExpense') {
  destroyChart(chartKey);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const incomeMonths = Income.getMonths(6);
  const expenseMonths = Expenses.getMonths(6);
  const defaults = getChartDefaults();

  const hasData = incomeMonths.some(d => d.amount > 0) || expenseMonths.some(d => d.amount > 0);
  if (!hasData) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="bar-chart-2" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No data yet</h3>
        <p>Add income and expenses to see comparison.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  chartInstances[chartKey] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: incomeMonths.map(d => d.month),
      datasets: [
        {
          label: 'Income',
          data: incomeMonths.map(d => d.amount),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false
        },
        {
          label: 'Expenses',
          data: expenseMonths.map(d => d.amount),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: defaults.color, font: { family: defaults.fontFamily, size: 11 }, usePointStyle: true }
        },
        tooltip: {
          callbacks: { label: ctx => ctx.dataset.label + ': ' + Currency.getSymbol() + ctx.parsed.y.toLocaleString() }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: defaults.gridColor },
          ticks: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 11 },
            callback: v => Currency.getSymbol() + v.toLocaleString()
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: defaults.color, font: { family: defaults.fontFamily, size: 10 } }
        }
      }
    }
  });
}

function createSavingsRateChart() {
  destroyChart('savingsRate');
  const canvas = document.getElementById('savingsRateChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const defaults = getChartDefaults();
  const totalIncome = Income.getTotal();
  const totalExpenses = Expenses.getTotal();

  if (totalIncome <= 0) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="pie-chart" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No income data</h3>
        <p>Add income to calculate savings rate.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  const savings = Math.max(totalIncome - totalExpenses, 0);
  const rate = Math.min((savings / totalIncome) * 100, 100);
  const spentRate = 100 - rate;

  chartInstances.savingsRate = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Saved', 'Spent'],
      datasets: [{
        data: [rate, spentRate],
        backgroundColor: ['#10b981', 'rgba(148, 163, 184, 0.2)'],
        borderWidth: 0,
        borderRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '80%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + ctx.parsed.toFixed(1) + '%' } }
      }
    },
    plugins: [{
      id: 'centerText',
      afterDraw(chart) {
        const { width, height, ctx: c } = chart;
        c.save();
        const text = rate.toFixed(1) + '%';
        c.font = '700 28px Inter, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = defaults.color;
        c.fillText(text, width / 2, height / 2 - 8);
        c.font = '12px Inter, sans-serif';
        c.fillStyle = '#94a3b8';
        c.fillText('Savings Rate', width / 2, height / 2 + 18);
        c.restore();
      }
    }]
  });
}

function createTopCategoryChart() {
  destroyChart('topCategory');
  const canvas = document.getElementById('topCategoryChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const byCategory = Expenses.getByCategory();
  const defaults = getChartDefaults();
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="list" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No expenses yet</h3>
        <p>Add expenses to see category breakdown.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  const labels = sorted.map(s => s[0]);
  const data = sorted.map(s => s[1]);
  const colors = labels.map(l => Utils.getCategoryColor(l));

  chartInstances.topCategory = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => Currency.getSymbol() + ctx.parsed.x.toLocaleString() }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: defaults.gridColor },
          ticks: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 11 },
            callback: v => Currency.getSymbol() + v.toLocaleString()
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: defaults.color, font: { family: defaults.fontFamily, size: 11 } }
        }
      }
    }
  });
}

function createHeatmapCalendar(containerId = 'heatmapCalendar') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const loading = container.querySelector('.chart-loading');
  if (loading) loading.classList.add('hidden');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const dailyTotals = {};
  Expenses.getAll().forEach(e => {
    const d = new Date(e.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
    }
  });

  const amounts = Object.values(dailyTotals);
  const maxAmount = amounts.length ? Math.max(...amounts) : 0;

  function getIntensity(amount) {
    if (amount === 0) return 0;
    const ratio = amount / maxAmount;
    if (ratio > 0.75) return 4;
    if (ratio > 0.5) return 3;
    if (ratio > 0.25) return 2;
    return 1;
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let html = `<div style="padding:12px">
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px">${monthName}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">`;

  for (const d of dayNames) {
    html += `<div style="font-size:10px;color:var(--text-lighter);padding:2px 0">${d}</div>`;
  }

  for (let i = 0; i < firstDay; i++) {
    html += `<div></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const amount = dailyTotals[day] || 0;
    const intensity = getIntensity(amount);
    const color = intensity === 0 ? 'var(--border)' :
                  intensity === 1 ? 'rgba(16,185,129,0.2)' :
                  intensity === 2 ? 'rgba(16,185,129,0.4)' :
                  intensity === 3 ? 'rgba(16,185,129,0.65)' :
                  'rgba(16,185,129,0.9)';
    const isToday = day === now.getDate();
    html += `<div style="aspect-ratio:1;border-radius:6px;background:${color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:${isToday?700:400};color:${intensity>2?'#fff':'var(--text-light)'};${isToday?'outline:2px solid var(--primary);outline-offset:-2px':''}" title="${Utils.formatCurrency(amount)}">${day}</div>`;
  }

  html += `</div>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:10px;font-size:10px;color:var(--text-lighter)">
      <span>Less</span>
      <span style="width:14px;height:14px;border-radius:4px;background:var(--border)"></span>
      <span style="width:14px;height:14px;border-radius:4px;background:rgba(16,185,129,0.2)"></span>
      <span style="width:14px;height:14px;border-radius:4px;background:rgba(16,185,129,0.4)"></span>
      <span style="width:14px;height:14px;border-radius:4px;background:rgba(16,185,129,0.65)"></span>
      <span style="width:14px;height:14px;border-radius:4px;background:rgba(16,185,129,0.9)"></span>
      <span>More</span>
    </div>
  </div>`;

  container.innerHTML = html;
}

function createLineChart(canvasId = 'savingsLineChart', chartKey = 'lineChart') {
  destroyChart(chartKey);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const incomeMonthly = Income.getLast6Months();
  const expenseMonthly = Expenses.getLast6Months();
  const defaults = getChartDefaults();

  const hasData = incomeMonthly.some(d => d.amount > 0) || expenseMonthly.some(d => d.amount > 0);
  if (!hasData) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="trending-up" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No data available</h3>
        <p>Add income and expenses to see your savings growth.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  let cumulative = 0;
  const savingsData = incomeMonthly.map((d, i) => {
    cumulative += (d.amount - expenseMonthly[i].amount);
    return Math.max(cumulative, 0);
  });

  chartInstances[chartKey] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: incomeMonthly.map(d => d.month),
      datasets: [{
        label: 'Savings',
        data: savingsData,
        fill: true,
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        borderColor: '#2ecc71',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: '#2ecc71',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: defaults.color,
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: ctx => Currency.getSymbol() + ctx.parsed.y.toLocaleString()
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: defaults.gridColor },
          ticks: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 11 },
            callback: v => Currency.getSymbol() + v.toLocaleString()
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: defaults.color,
            font: { family: defaults.fontFamily, size: 11 }
          }
        }
      }
    }
  });
}



function hideChartLoadings() {
  document.querySelectorAll('.chart-loading').forEach(el => {
    el.classList.add('hidden');
  });
}

function renderInsights() {
  const container = document.getElementById('insightsContainer');
  if (!container) return;

  const expenses = Expenses.getAll();
  const income = Income.getAll();
  const investments = Investments.getAll();
  const hasAnyData = expenses.length > 0 || income.length > 0 || investments.length > 0;

  if (!hasAnyData) {
    container.innerHTML = `
      <div class="insight-card">
        <div class="insight-icon tip"><i data-lucide="lightbulb" style="width:20px;height:20px"></i></div>
        <div class="insight-text">
          <strong>Welcome to MoneyMint AI!</strong><br>
          Start by adding your income and expenses to get personalized financial insights.
        </div>
      </div>
      <div class="insight-card">
        <div class="insight-icon info"><i data-lucide="info" style="width:20px;height:20px"></i></div>
        <div class="insight-text">
          <strong>Pro Tip:</strong><br>
          Set monthly budgets to keep your spending on track and avoid overspending.
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  const insights = [];

  const byCategory = Expenses.getByCategory();
  const cats = Object.keys(byCategory);
  if (cats.length > 0) {
    const top = cats.sort((a, b) => byCategory[b] - byCategory[a])[0];
    insights.push({ icon: 'alert', text: `"${top}" is your highest spending category at ${Utils.formatCurrency(byCategory[top])}` });
  }

  const monthlyExpenses = Expenses.getLast6Months().filter(m => m.amount > 0);
  if (monthlyExpenses.length >= 2) {
    const last = monthlyExpenses[monthlyExpenses.length - 1].amount;
    const prev = monthlyExpenses[monthlyExpenses.length - 2].amount;
    if (prev > 0) {
      const change = ((last - prev) / prev * 100).toFixed(1);
      if (change > 0) {
        insights.push({ icon: 'alert', text: `Your expenses increased by ${change}% this month` });
      } else {
        insights.push({ icon: 'tip', text: `Your expenses decreased by ${Math.abs(change)}% this month` });
      }
    }
  }

  const totalIncome = Income.getTotal();
  const totalExpenses = Expenses.getTotal();
  if (totalIncome > 0) {
    const savings = Math.max(totalIncome - totalExpenses, 0);
    const rate = (savings / totalIncome * 100).toFixed(1);
    insights.push({ icon: 'tip', text: `You're saving ${rate}% of your total income (${Utils.formatCurrency(savings)})` });
  }

  const monthlyIncome = Income.getLast6Months().filter(m => m.amount > 0);
  if (monthlyIncome.length >= 2 && monthlyExpenses.length >= 2) {
    const lastSavings = Math.max(monthlyIncome[monthlyIncome.length - 1].amount - monthlyExpenses[monthlyExpenses.length - 1].amount, 0);
    const prevSavings = Math.max(monthlyIncome[monthlyIncome.length - 2].amount - monthlyExpenses[monthlyExpenses.length - 2].amount, 0);
    if (prevSavings > 0 && lastSavings > prevSavings) {
      const growth = ((lastSavings - prevSavings) / prevSavings * 100).toFixed(0);
      insights.push({ icon: 'tip', text: `You saved ${growth}% more compared to last month` });
    }
  }

  const monthlyInvestments = Investments.getLast6Months();
  const nonZeroInvestments = monthlyInvestments.filter(m => m.amount > 0);
  if (nonZeroInvestments.length >= 3) {
    insights.push({ icon: 'info', text: 'Investments have been growing steadily for 3 consecutive months' });
  }

  if (cats.length > 0 && cats.some(c => byCategory[c] > 0)) {
    insights.push({ icon: 'info', text: 'Consider setting category budgets to optimize your spending habits' });
  }

  const unique = insights.filter((item, idx) => insights.findIndex(i => i.text === item.text) === idx).slice(0, 4);

  container.innerHTML = unique.map(ins => `
    <div class="insight-card">
      <div class="insight-icon ${ins.icon}"><i data-lucide="${ins.icon === 'alert' ? 'alert-triangle' : ins.icon === 'tip' ? 'lightbulb' : 'info'}" style="width:20px;height:20px"></i></div>
      <div class="insight-text"><strong>${ins.icon === 'alert' ? 'Alert' : ins.icon === 'tip' ? 'Insight' : 'Info'}:</strong><br>${ins.text}</div>
    </div>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderMonthlySpendingTable(monthCount, containerId = 'monthlySpendingTableBody') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const expenseMonths = Expenses.getMonths(monthCount);
  const incomeMonths = Income.getMonths(monthCount);

  const hasData = expenseMonths.some(d => d.amount > 0) || incomeMonths.some(d => d.amount > 0);

  if (!hasData) {
    container.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <i data-lucide="calendar" class="empty-state-icon" style="width:36px;height:36px"></i>
            <h3>No data available</h3>
            <p>Add income and expenses to see monthly breakdown.</p>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  let html = '';
  for (let i = 0; i < monthCount; i++) {
    const expense = expenseMonths[i]?.amount || 0;
    const income = incomeMonths[i]?.amount || 0;
    const savings = Math.max(income - expense, 0);
    const monthLabel = expenseMonths[i]?.month || incomeMonths[i]?.month || '';

    html += `<tr>
      <td><strong>${monthLabel}</strong></td>
      <td class="transaction-amount negative">${Utils.formatCurrency(expense)}</td>
      <td class="transaction-amount positive">${Utils.formatCurrency(income)}</td>
      <td class="transaction-amount positive">${Utils.formatCurrency(savings)}</td>
    </tr>`;
  }

  container.innerHTML = html;
}

function setupAnalyticsTimeRange() {
  const selector = document.getElementById('timeRangeSelect');
  if (!selector) return;

  selector.addEventListener('change', () => {
    selectedMonthRange = parseInt(selector.value, 10);
    createBarChart('monthlyBarChartA', 'barChartAnalytics', selectedMonthRange);
    renderMonthlySpendingTable(selectedMonthRange);
    hideChartLoadings();
  });
}

function renderAllCharts() {
  const defaults = getChartDefaults();
  Chart.defaults.color = defaults.color;
  Chart.defaults.font.family = defaults.fontFamily;

  createPieChart();
  createPieChart('dashboardExpensePieChart', 'dashboardPieChart');
  createWeeklyBarChart();
  createIncomeVsExpenseChart();
  createIncomeVsExpenseChart('dashboardIncomeVsExpenseChart', 'dashboardIncomeVsExpense');
  createSavingsRateChart();
  createTopCategoryChart();
  createHeatmapCalendar();
  createHeatmapCalendar('dashboardHeatmap');
  createBarChart('monthlyBarChart', 'barChart');
  createBarChart('monthlyBarChartA', 'barChartAnalytics', selectedMonthRange);
  createLineChart('savingsLineChart', 'lineChart');
  renderMonthlySpendingTable(selectedMonthRange);
  renderMonthlySpendingTable(6, 'dashboardMonthlySpendingTableBody');
  renderInsights();
  hideChartLoadings();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('expensePieChart') || document.getElementById('monthlyBarChart')) {
    setTimeout(renderAllCharts, 300);
  }
  setTimeout(setupAnalyticsTimeRange, 300);
});
