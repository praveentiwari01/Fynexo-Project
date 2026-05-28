const API_BASE = 'https://moneymint-project.onrender.com';
const Goals = {
  _cache: [],

  async init() {
    await this._sync();
  },

  async _sync() {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      this._cache = Storage.get('goals', []);
      return;
    }
    try {
      const token = Auth.getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/goals`, {
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
      name: data.name,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount) || 0,
      deadline: data.deadline || '',
      createdAt: new Date().toISOString()
    };

    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const goals = Storage.get('goals', []);
      goals.push(entry);
      Storage.set('goals', goals);
      this._sync();
      return entry;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      }).then(res => {
        if (res.ok) this._sync();
      });
    }
    return entry;
  },

  update(id, data) {
    const isGuest = localStorage.getItem('mm_is_guest') === 'true';
    if (isGuest) {
      const goals = Storage.get('goals', []);
      const index = goals.findIndex(g => g.id === id);
      if (index !== -1) {
        goals[index] = { ...goals[index], ...data, currentAmount: parseFloat(data.currentAmount) };
        Storage.set('goals', goals);
      }
      this._sync();
      return;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/goals`, {
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
      const goals = Storage.get('goals', []);
      Storage.set('goals', goals.filter(g => g.id !== id));
      this._sync();
      return;
    }

    const token = Auth.getToken();
    if (token) {
      fetch(`${API_BASE}/api/goals`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.ok) this._sync();
      });
    }
  }
};

function renderGoals() {
  const container = document.getElementById('goalsContainer');
  if (!container) return;

  const goals = Goals.getAll();

  if (!goals.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px">
        <i data-lucide="flag" class="empty-state-icon" style="width:48px;height:48px"></i>
        <h3>No savings goals yet</h3>
        <p>Set financial goals to track your progress.</p>
        <button class="btn btn-primary btn-sm mt-4" onclick="openGoalModal()">Add Goal</button>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  container.innerHTML = goals.map(g => {
    const percent = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
    const isComplete = g.currentAmount >= g.targetAmount;
    const remaining = Math.max(g.targetAmount - g.currentAmount, 0);

    return `
      <div class="card goal-card">
        <div class="goal-header">
          <div class="goal-info">
            <div class="goal-name">${g.name}</div>
            <div class="goal-deadline">${g.deadline ? 'Due: ' + Utils.formatDate(g.deadline) : 'No deadline'}</div>
          </div>
          <div class="goal-amounts">
            <div class="goal-target">${Utils.formatCurrency(g.targetAmount)}</div>
            <div class="goal-current">${Utils.formatCurrency(g.currentAmount)} saved</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill ${isComplete ? 'complete' : percent > 80 ? 'warning' : ''}" style="width:${percent}%"></div>
        </div>
        <div class="goal-stats">
          <span>${percent.toFixed(0)}% complete</span>
          ${isComplete ? '<span class="goal-complete">Goal achieved!</span>' : `<span>${Utils.formatCurrency(remaining)} remaining</span>`}
        </div>
        <div class="goal-actions">
          <button class="btn btn-outline btn-sm" onclick="openGoalUpdateModal('${g.id}')">
            <i data-lucide="plus" style="width:14px;height:14px"></i>
            Add Progress
          </button>
          <button class="btn btn-ghost btn-sm" onclick="deleteGoal('${g.id}')" style="color:var(--danger)">
            <i data-lucide="trash-2" style="width:14px;height:14px"></i>
          </button>
        </div>
      </div>
    `;
  }).join('') + `
    <div style="text-align:center;margin-top:16px">
      <button class="btn btn-primary btn-sm" onclick="openGoalModal()">
        <i data-lucide="plus" style="width:16px;height:16px"></i>
        Add New Goal
      </button>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openGoalModal() {
  const modal = document.getElementById('goalModal');
  if (!modal) return;
  modal.classList.add('active');

  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalCurrent').value = '0';
  document.getElementById('goalDeadline').value = '';
  document.getElementById('goalModalTitle').textContent = 'New Savings Goal';
}

let goalEditId = null;

function openGoalUpdateModal(id) {
  const goals = Goals.getAll();
  const goal = goals.find(g => g.id === id);
  if (!goal) return;

  goalEditId = id;
  const modal = document.getElementById('goalModal');
  if (!modal) return;
  modal.classList.add('active');

  document.getElementById('goalModalTitle').textContent = 'Update Progress: ' + goal.name;
  document.getElementById('goalName').value = goal.name;
  document.getElementById('goalTarget').value = goal.targetAmount;
  document.getElementById('goalCurrent').value = goal.currentAmount;
  document.getElementById('goalDeadline').value = goal.deadline || '';
}

function closeGoalModal() {
  const modal = document.getElementById('goalModal');
  if (modal) modal.classList.remove('active');
  goalEditId = null;
}

function saveGoal() {
  const name = document.getElementById('goalName').value.trim();
  const target = document.getElementById('goalTarget').value;
  const current = document.getElementById('goalCurrent').value;
  const deadline = document.getElementById('goalDeadline').value;

  if (!name || !target || parseFloat(target) <= 0) {
    Toast.error('Please enter a goal name and target amount.');
    return;
  }

  if (goalEditId) {
    Goals.update(goalEditId, { name, targetAmount: parseFloat(target), currentAmount: parseFloat(current) || 0, deadline });
    Toast.success('Goal updated successfully!');
  } else {
    Goals.add({ name, targetAmount: parseFloat(target), currentAmount: parseFloat(current) || 0, deadline });
    Toast.success('Goal created successfully!');
  }

  closeGoalModal();
  setTimeout(() => {
    renderGoals();
    updateDashboardSummary();
  }, 200);
}

function deleteGoal(id) {
  if (!confirm('Delete this savings goal?')) return;
  Goals.delete(id);
  Toast.success('Goal deleted.');
  setTimeout(renderGoals, 200);
}
