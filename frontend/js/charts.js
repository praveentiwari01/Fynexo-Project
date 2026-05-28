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

function createPieChart() {
  destroyChart('pieChart');
  const canvas = document.getElementById('expensePieChart');
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

  chartInstances.pieChart = new Chart(ctx, {
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

function createDoughnutChart() {
  destroyChart('doughnutChart');
  const canvas = document.getElementById('incomeDoughnutChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const byCategory = Income.getByCategory();
  const defaults = getChartDefaults();
  const categories = Object.keys(byCategory);

  if (!categories.length) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="circle" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No income data yet</h3>
        <p>Add income to see the breakdown.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  const incomeColors = {
    'Salary': '#10b981',
    'Freelance': '#3b82f6',
    'Business': '#8b5cf6',
    'Investment Returns': '#f59e0b',
    'Other': '#94a3b8'
  };
  const colors = categories.map(c => incomeColors[c] || '#94a3b8');

  chartInstances.doughnutChart = new Chart(ctx, {
    type: 'doughnut',
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
      cutout: '65%',
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

function createInvestmentPieChart() {
  destroyChart('investmentPieChart');
  const canvas = document.getElementById('investmentPieChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const byType = Investments.getByType();
  const defaults = getChartDefaults();
  const types = Object.keys(byType);

  if (!types.length) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="trending-up" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No investments yet</h3>
        <p>Add investments to see your portfolio.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  const colors = types.map(c => Utils.getCategoryColor(c));

  chartInstances.investmentPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: types,
      datasets: [{
        data: types.map(c => byType[c]),
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

function createInvestmentBarChart() {
  destroyChart('investmentBarChart');
  const canvas = document.getElementById('investmentBarChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const monthlyData = Investments.getLast6Months();
  const defaults = getChartDefaults();

  const hasData = monthlyData.some(d => d.amount > 0);
  if (!hasData) {
    _setChartEmptyState(canvas, `
      <div class="empty-state" style="height:300px">
        <i data-lucide="trending-up" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No investments yet</h3>
        <p>Add investments to see your portfolio growth.</p>
      </div>
    `);
    return;
  }
  _clearChartEmptyState(canvas);

  chartInstances.investmentBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Investments',
        data: monthlyData.map(d => d.amount),
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
        legend: { display: false }
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
          <strong>Welcome to MoneyMint!</strong><br>
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

function renderMonthlySpendingTable(monthCount) {
  const container = document.getElementById('monthlySpendingTableBody');
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
  createBarChart('monthlyBarChart', 'barChart');
  createBarChart('monthlyBarChartA', 'barChartAnalytics', selectedMonthRange);
  createDoughnutChart();
  createLineChart('savingsLineChart', 'lineChart');
  createLineChart('savingsLineChartA', 'lineChartAnalytics');
  createInvestmentPieChart();
  createInvestmentBarChart();
  renderMonthlySpendingTable(selectedMonthRange);
  renderInsights();
  hideChartLoadings();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('expensePieChart') || document.getElementById('monthlyBarChart')) {
    setTimeout(renderAllCharts, 300);
  }
  setTimeout(setupAnalyticsTimeRange, 300);
});
