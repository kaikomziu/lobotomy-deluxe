// ===== LOBOTOMY DELUXE - ui.js =====
// 画面描画・DOM操作

function el(id) { return document.getElementById(id); }
function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function showTitleScreen(hasSave) {
  el('app').style.display = 'none';
  const title = el('title-screen');
  title.style.display = 'flex';
  el('continue-btn').style.display = hasSave ? 'inline-block' : 'none';
  el('best-day-label').textContent = meta.bestDay > 0 ? `最長記録: Day ${meta.bestDay}` : '';
}

function hideTitleScreen() {
  el('title-screen').style.display = 'none';
  el('app').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  window.LobotomyGame.init();

  el('new-game-btn').addEventListener('click', () => {
    hideTitleScreen();
    window.LobotomyGame.startNewGame();
  });
  el('continue-btn').addEventListener('click', () => {
    hideTitleScreen();
    if (!window.LobotomyGame.continueGame()) window.LobotomyGame.startNewGame();
  });
  el('next-phase-btn').addEventListener('click', () => window.LobotomyGame.nextPhase());
  el('hire-btn').addEventListener('click', () => window.LobotomyGame.hireEmployee());
  el('retire-btn').addEventListener('click', () => {
    if (confirm('現在の運営を終了して結果を確定しますか？')) window.LobotomyGame.retireGame();
  });
  el('help-btn').addEventListener('click', () => el('help-modal').classList.add('open'));
  el('help-close').addEventListener('click', () => el('help-modal').classList.remove('open'));
  el('achv-btn').addEventListener('click', () => { renderAchievementsModal(); el('achv-modal').classList.add('open'); });
  el('achv-close').addEventListener('click', () => el('achv-modal').classList.remove('open'));
  el('changelog-btn').addEventListener('click', () => el('changelog-modal').classList.add('open'));
  el('changelog-close').addEventListener('click', () => el('changelog-modal').classList.remove('open'));
  el('gameover-title-btn').addEventListener('click', () => {
    el('gameover-modal').classList.remove('open');
    showTitleScreen(!!localStorage.getItem(SAVE_KEY));
  });
});

function render() {
  if (!state) return;
  renderHeader();
  renderCells();
  renderEmployees();
  renderLog();
  if (newlyUnlocked && newlyUnlocked.length > 0) {
    showAchievementToast(newlyUnlocked);
    newlyUnlocked = [];
  }
  if (state.gameOver) {
    renderGameOverModal();
  }
}

function renderHeader() {
  el('stat-day').textContent = state.day;
  el('stat-phase').textContent = `${state.phase} / ${PHASES_PER_DAY}`;
  el('stat-reputation').textContent = state.reputation;
  el('stat-coin').textContent = state.coin;

  const repBar = el('reputation-bar-fill');
  repBar.style.width = clamp(state.reputation / 150 * 100, 0, 100) + '%';
  repBar.className = 'bar-fill ' + (state.reputation <= 30 ? 'bar-danger' : state.reputation <= 70 ? 'bar-warn' : 'bar-ok');

  const quotaWrap = el('quota-list');
  quotaWrap.innerHTML = '';
  WORKTYPES.forEach(w => {
    const cur = state.energy[w.key];
    const q = state.quota[w.key];
    const pct = clamp(cur / q * 100, 0, 100);
    const div = document.createElement('div');
    div.className = 'quota-item';
    div.innerHTML = `
      <div class="quota-label" style="color:${w.color}">${w.label}</div>
      <div class="quota-bar"><div class="quota-bar-fill" style="width:${pct}%;background:${w.color}"></div></div>
      <div class="quota-num">${cur} / ${q}</div>
    `;
    quotaWrap.appendChild(div);
  });
}

function renderCells() {
  const wrap = el('cells-grid');
  wrap.innerHTML = '';
  state.cells.forEach(cell => {
    const div = document.createElement('div');
    div.className = 'cell';
    if (!cell.abno) {
      div.classList.add('cell-empty');
      div.innerHTML = `<div class="cell-empty-label">空室</div>`;
      wrap.appendChild(div);
      return;
    }
    const abno = cell.abno;
    const tier = tierInfo(abno.tier);
    div.style.borderColor = tier.color;
    if (cell.breached) div.classList.add('cell-breached');

    const typeBadges = abno.types.map(t => {
      const wt = WORKTYPES.find(w => w.key === t);
      return `<span class="type-badge" style="background:${wt.color}22;color:${wt.color};border-color:${wt.color}">${wt.label}</span>`;
    }).join('');

    const counterPips = cell.breached
      ? `<div class="breach-progress">鎮圧進捗 ${cell.breachProgress} / ${cell.breachReq}</div>`
      : `<div class="counter-pips">${'●'.repeat(Math.max(cell.counter,0))}${'○'.repeat(Math.max(cell.maxCounter - cell.counter,0))}</div>`;

    const assignedNames = cell.assigned.map(id => {
      const e = state.employees.find(x => x.id === id);
      return e ? `<span class="assigned-chip">${esc(e.name)}</span>` : '';
    }).join('');

    div.innerHTML = `
      <div class="cell-head">
        <span class="tier-badge" style="background:${tier.color}22;color:${tier.color};border-color:${tier.color}">${tier.label}</span>
        <span class="cell-status">${cell.breached ? '⚠ 脱走中' : '収容中'}</span>
      </div>
      <div class="cell-name" title="${esc(abno.desc)}">${esc(abno.name)}</div>
      <div class="cell-types">${typeBadges}</div>
      ${counterPips}
      <div class="assigned-list">${assignedNames || '<span class="assigned-empty">未割当</span>'}</div>
    `;
    div.addEventListener('click', () => window.LobotomyGame.toggleAssign(cell.id));
    wrap.appendChild(div);
  });
}

function renderEmployees() {
  const wrap = el('employee-list');
  wrap.innerHTML = '';
  const aliveCount = state.employees.filter(e => e.alive).length;
  el('roster-count').textContent = aliveCount;

  state.employees.forEach(emp => {
    const div = document.createElement('div');
    div.className = 'employee-card';
    if (!emp.alive) { div.classList.add('employee-dead'); }
    if (emp.id === state.selectedEmployeeId) div.classList.add('employee-selected');
    const assignedCell = state.cells.find(c => c.assigned.includes(emp.id));
    if (assignedCell) div.classList.add('employee-busy');

    const statSpans = WORKTYPES.map(w => `<span class="stat-chip" style="color:${w.color}">${w.label}${emp.stats[w.key]}</span>`).join('');

    div.innerHTML = `
      <div class="emp-name-row">
        <span class="emp-name">${esc(emp.name)}</span>
        ${!emp.alive ? '<span class="emp-dead-badge">殉職</span>' : ''}
      </div>
      <div class="emp-bars">
        <div class="mini-bar"><div class="mini-bar-fill hp" style="width:${emp.hp}%"></div><span class="mini-bar-label">HP ${emp.hp}</span></div>
        <div class="mini-bar"><div class="mini-bar-fill sp" style="width:${emp.sp}%"></div><span class="mini-bar-label">SP ${emp.sp}</span></div>
      </div>
      <div class="emp-stats">${statSpans}</div>
      <div class="emp-quote">${esc(emp.quote)}</div>
      ${emp.alive ? `<button class="rest-btn" data-id="${emp.id}">休養(15c)</button>` : ''}
    `;
    if (emp.alive) {
      div.addEventListener('click', (e) => {
        if (e.target.classList.contains('rest-btn')) return;
        window.LobotomyGame.selectEmployee(emp.id);
      });
      const restBtn = div.querySelector('.rest-btn');
      restBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.LobotomyGame.restEmployee(emp.id);
      });
    }
    wrap.appendChild(div);
  });
}

function renderLog() {
  const wrap = el('log-list');
  wrap.innerHTML = state.log.slice(0, 60).map(entry =>
    `<div class="log-entry"><span class="log-tag">D${entry.day}-${entry.phase}</span>${esc(entry.msg)}</div>`
  ).join('');
}

function renderAchievementsModal() {
  const wrap = el('achv-list');
  wrap.innerHTML = '';
  el('achv-progress').textContent = `${meta.unlocked.length} / ${ACHIEVEMENTS.length}`;
  ACHIEVEMENTS.forEach(a => {
    const done = meta.unlocked.includes(a.id);
    const div = document.createElement('div');
    div.className = 'achv-item ' + (done ? 'achv-done' : 'achv-locked');
    div.innerHTML = `
      <div class="achv-name">${done ? '🏅' : '🔒'} ${esc(a.name)}</div>
      <div class="achv-desc">${esc(a.desc)}</div>
    `;
    wrap.appendChild(div);
  });
}

function showAchievementToast(list) {
  const wrap = el('toast-wrap');
  list.forEach(a => {
    const div = document.createElement('div');
    div.className = 'toast';
    div.innerHTML = `<div class="toast-title">🏅 実績解除</div><div class="toast-name">${esc(a.name)}</div>`;
    wrap.appendChild(div);
    setTimeout(() => { div.classList.add('toast-out'); setTimeout(() => div.remove(), 500); }, 3200);
  });
}

function renderGameOverModal() {
  const reasonText = {
    reputation: '信頼度が0に達し、施設は閉鎖されました。',
    wipeout: '職員が全員いなくなり、施設の運営は破綻しました。',
    retire: '円満に運営を終了しました。お疲れ様でした。',
  }[state.endReason] || '運営が終了しました。';

  el('gameover-reason').textContent = reasonText;
  el('gameover-day').textContent = state.day;
  el('gameover-energy').textContent = state.stats.totalEnergyThisRun;
  el('gameover-deaths').textContent = state.stats.deathsThisRun;
  el('gameover-suppressed').textContent = state.stats.breachSuppressedThisRun;

  const grade = computeGrade();
  el('gameover-grade').textContent = grade;

  el('gameover-modal').classList.add('open');
}

function computeGrade() {
  const score = state.day * 10 + state.stats.totalEnergyThisRun * 0.5 - state.stats.deathsThisRun * 15;
  if (score >= 500) return 'S';
  if (score >= 300) return 'A';
  if (score >= 180) return 'B';
  if (score >= 90) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}
