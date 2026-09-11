// ===== LOBOTOMY DELUXE - game.js =====
// ゲームロジック本体

const SAVE_KEY = 'lobotomyDeluxe_save_v1';
const META_KEY = 'lobotomyDeluxe_meta_v1';
const PHASES_PER_DAY = 3;
const START_CELLS = 6;
const MAX_ASSIGN_PER_CELL = 3;

let state = null;
let meta = null; // 永続データ(実績・累計統計)
let idSeq = 1;

function nextId() { return idSeq++; }

// ---------- 永続メタデータ ----------
function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return {
    bestDay: 0,
    totalEnergyAllTime: 0,
    totalHires: 0,
    totalDeaths: 0,
    totalBreachSuppressed: 0,
    totalRests: 0,
    uniqueContained: [],
    maxStatSeen: 0,
    maxCombatSeen: 0,
    tutorialSeen: false,
    unlocked: [],
  };
}
function saveMeta() {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* ignore */ }
}

// ---------- エージェント生成 ----------
function randomEmployee() {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const given = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
  const stats = {};
  WORKTYPES.forEach(w => { stats[w.key] = 2 + Math.floor(Math.random() * 3); }); // 2-4
  return {
    id: nextId(),
    name: surname + ' ' + given,
    department: SEPHIROT_DEPARTMENTS[Math.floor(Math.random() * SEPHIROT_DEPARTMENTS.length)],
    stats,
    combat: 2 + Math.floor(Math.random() * 3), // 鎮圧(戦闘)専用ステータス。2-4
    hp: 100, maxHp: 100,
    sp: 100, maxSp: 100,
    alive: true,
    resting: false,
    quote: EMPLOYEE_QUOTES[Math.floor(Math.random() * EMPLOYEE_QUOTES.length)],
  };
}

function employeeLevel(emp) {
  const vals = WORKTYPES.map(w => emp.stats[w.key]);
  return (vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ---------- ゲーム初期化 ----------
function createNewState() {
  const s = {
    day: 1,
    phase: 1,
    reputation: 100,
    coin: 30,
    energy: {}, quota: {},
    cells: [],
    employees: [],
    selectedEmployeeId: null,
    log: [],
    deliveredIds: [],
    startedAt: Date.now(),
    gameOver: false,
    endReason: null,
    // ラン内集計(実績判定用)
    stats: {
      totalEnergyThisRun: 0,
      deathsThisRun: 0,
      hiresThisRun: 0,
      restsThisRun: 0,
      breachSuppressedThisRun: 0,
      quotaStreak: 0,
      breachCountByAbno: {},
      simulBreachMax: 0,
      sawHp1Survivor: false,
      sawZeroSp: false,
      allIdlePhase: false,
      retired: false,
      wipedOut: false,
    },
  };
  WORKTYPES.forEach(w => { s.energy[w.key] = 0; s.quota[w.key] = 0; });
  for (let i = 0; i < START_CELLS; i++) {
    s.cells.push(makeEmptyCell());
  }
  for (let i = 0; i < 4; i++) s.employees.push(randomEmployee());
  computeQuota(s);
  return s;
}

function makeEmptyCell() {
  return {
    id: nextId(),
    abno: null,
    counter: 0,
    maxCounter: 0,
    breached: false,
    breachProgress: 0,
    breachReq: 0,
    assigned: [],
  };
}

function computeQuota(s) {
  const containedTypes = {};
  WORKTYPES.forEach(w => containedTypes[w.key] = 0);
  s.cells.forEach(c => {
    if (c.abno) c.abno.types.forEach(t => containedTypes[t]++);
  });
  WORKTYPES.forEach(w => {
    const base = 2 + s.day * 0.8 + containedTypes[w.key] * 1.4;
    s.quota[w.key] = Math.max(2, Math.round(base));
  });
}

function pickAbnoToDeliver(s) {
  const remaining = ABNORMALITIES.filter(a => !s.deliveredIds.includes(a.id));
  if (remaining.length === 0) return null;
  remaining.sort((a, b) => a.tier - b.tier);
  const pool = remaining.filter(a => a.tier === remaining[0].tier);
  return pool[Math.floor(Math.random() * pool.length)];
}

function deliverAbnormality(s) {
  const emptyCell = s.cells.find(c => !c.abno);
  if (!emptyCell) {
    s.cells.push(makeEmptyCell());
  }
  const target = s.cells.find(c => !c.abno);
  const abno = pickAbnoToDeliver(s);
  if (!abno || !target) return;
  const p = TIER_PARAMS[abno.tier];
  target.abno = abno;
  target.counter = p.qliphoth;
  target.maxCounter = p.qliphoth;
  target.breached = false;
  target.breachProgress = 0;
  target.breachReq = p.suppressReq;
  target.assigned = [];
  s.deliveredIds.push(abno.id);
  addLog(s, `【搬入】新たなアブノーマリティ「${abno.name}」(${tierInfo(abno.tier).label})が搬入されました。`);
  computeQuota(s);
}

function addLog(s, msg) {
  s.log.unshift({ day: s.day, phase: s.phase, msg });
  if (s.log.length > 200) s.log.length = 200;
}

// ---------- 割り当て操作 ----------
function selectEmployee(empId) {
  if (state.selectedEmployeeId === empId) { state.selectedEmployeeId = null; }
  else { state.selectedEmployeeId = empId; }
  render();
}

function isEmployeeAssignedSomewhere(empId) {
  return state.cells.some(c => c.assigned.includes(empId));
}

function toggleAssign(cellId) {
  const cell = state.cells.find(c => c.id === cellId);
  if (!cell || !cell.abno) return;
  const empId = state.selectedEmployeeId;
  if (!empId) return;
  const emp = state.employees.find(e => e.id === empId);
  if (!emp || !emp.alive || emp.resting) return;

  // 既に割り当て済みなら解除
  if (cell.assigned.includes(empId)) {
    cell.assigned = cell.assigned.filter(id => id !== empId);
    state.selectedEmployeeId = null;
    render();
    return;
  }
  // 他のセルに割り当て済みなら先に解除
  state.cells.forEach(c => { c.assigned = c.assigned.filter(id => id !== empId); });

  if (!cell.breached && cell.assigned.length >= MAX_ASSIGN_PER_CELL) return;
  cell.assigned.push(empId);
  state.selectedEmployeeId = null;
  render();
}

// ---------- フェーズ進行 ----------
function nextPhase() {
  if (state.gameOver) return;

  const anyAssigned = state.cells.some(c => c.assigned.length > 0);
  if (!anyAssigned) state.stats.allIdlePhase = true;

  let breachesThisPhase = 0;

  state.cells.forEach(cell => {
    if (!cell.abno) return;
    if (cell.breached) {
      resolveBreachPhase(cell);
    } else {
      resolveWorkPhase(cell);
      if (cell.breached) breachesThisPhase++;
    }
  });

  if (breachesThisPhase > state.stats.simulBreachMax) {
    state.stats.simulBreachMax = breachesThisPhase;
  }

  // このフェーズの割り当てをクリア(毎フェーズ選び直す)
  state.cells.forEach(c => { c.assigned = []; });

  checkSurvivors();
  checkGameOverConditions();
  if (state.gameOver) { finalizeRun(); render(); return; }

  state.phase++;
  if (state.phase > PHASES_PER_DAY) {
    endDay();
  }
  runAchievementCheck();
  render();
}

function resolveWorkPhase(cell) {
  const abno = cell.abno;
  const p = TIER_PARAMS[abno.tier];
  cell.assigned.forEach(empId => {
    const emp = state.employees.find(e => e.id === empId);
    if (!emp || !emp.alive) return;
    const type = abno.types[Math.floor(Math.random() * abno.types.length)];
    const statVal = emp.stats[type];
    const chance = clamp(50 + (statVal - p.difficulty) * 10, 5, 95);
    const roll = Math.random() * 100;
    const badEndingChance = 3 + abno.tier * 2;
    const badRoll = Math.random() * 100;

    if (roll <= chance) {
      // 成功
      const gained = p.energy;
      state.energy[type] += gained;
      state.stats.totalEnergyThisRun += gained;
      meta.totalEnergyAllTime += gained;
      if (Math.random() < 0.15 && emp.stats[type] < 9) {
        emp.stats[type]++;
        if (emp.stats[type] > meta.maxStatSeen) meta.maxStatSeen = emp.stats[type];
      }
      emp.sp = clamp(emp.sp - 2, 0, emp.maxSp);
      addLog(state, `${emp.name}が「${abno.name}」の作業(${WORKTYPES.find(w=>w.key===type).label})に成功。+${gained}`);
    } else {
      emp.sp = clamp(emp.sp - 10, 0, emp.maxSp);
      if (Math.random() < 0.15 + abno.tier * 0.03) {
        const dmg = 5 + abno.tier * 3;
        emp.hp = clamp(emp.hp - dmg, 0, emp.maxHp);
        addLog(state, `${emp.name}が「${abno.name}」の作業に失敗し負傷した。(HP-${dmg})`);
      } else {
        addLog(state, `${emp.name}が「${abno.name}」の作業に失敗した。`);
      }
    }

    if (emp.sp <= 0 && !state.stats.sawZeroSp) state.stats.sawZeroSp = true;

    if (badRoll < badEndingChance) {
      cell.counter--;
      emp.hp = clamp(emp.hp - 15, 0, emp.maxHp);
      emp.sp = clamp(emp.sp - 15, 0, emp.maxSp);
      addLog(state, `【異変】「${abno.name}」の様子がおかしい…封印カウンターが減少した。(残り${Math.max(cell.counter,0)})`);
    }
  });

  if (cell.counter <= 0) {
    triggerBreach(cell);
  }
}

function triggerBreach(cell) {
  cell.breached = true;
  cell.breachProgress = 0;
  const abno = cell.abno;
  addLog(state, `【警報】「${abno.name}」が収容違反(脱走)を起こしました！`);
  const key = abno.id;
  state.stats.breachCountByAbno[key] = (state.stats.breachCountByAbno[key] || 0) + 1;
}

function resolveBreachPhase(cell) {
  const abno = cell.abno;
  const p = TIER_PARAMS[abno.tier];
  if (cell.assigned.length > 0) {
    let successes = 0;
    cell.assigned.forEach(empId => {
      const emp = state.employees.find(e => e.id === empId);
      if (!emp || !emp.alive) return;
      const statVal = emp.combat;
      const chance = clamp(45 + (statVal - (p.difficulty + 2)) * 10, 5, 90);
      const roll = Math.random() * 100;
      if (roll <= chance) {
        successes++;
        if (Math.random() < 0.2 && emp.combat < 9) {
          emp.combat++;
          if (emp.combat > meta.maxCombatSeen) meta.maxCombatSeen = emp.combat;
        }
        addLog(state, `${emp.name}が「${abno.name}」の鎮圧に成功した！`);
      } else {
        const dmg = Math.round(p.breachPower * 0.5);
        emp.hp = clamp(emp.hp - dmg, 0, emp.maxHp);
        emp.sp = clamp(emp.sp - 15, 0, emp.maxSp);
        addLog(state, `${emp.name}が鎮圧に失敗し「${abno.name}」から反撃を受けた。(HP-${dmg})`);
      }
    });
    cell.breachProgress += successes;
    if (cell.breachProgress >= cell.breachReq) {
      cell.breached = false;
      cell.counter = Math.max(1, Math.round(cell.maxCounter * 0.6));
      cell.breachProgress = 0;
      state.coin += 10 + abno.tier * 5;
      state.stats.breachSuppressedThisRun++;
      meta.totalBreachSuppressed++;
      addLog(state, `「${abno.name}」の再収容に成功しました。`);
    }
  } else {
    const idle = state.employees.filter(e => e.alive && !e.resting && !isEmployeeAssignedSomewhere(e.id));
    const pool = idle.length > 0 ? idle : state.employees.filter(e => e.alive && !e.resting);
    if (pool.length > 0) {
      const victim = pool[Math.floor(Math.random() * pool.length)];
      const dmg = p.breachPower + Math.floor(Math.random() * 4);
      victim.hp = clamp(victim.hp - dmg, 0, victim.maxHp);
      victim.sp = clamp(victim.sp - 10, 0, victim.maxSp);
      addLog(state, `【襲撃】「${abno.name}」が${victim.name}を襲撃した！(HP-${dmg})`);
    }
  }
}

function checkSurvivors() {
  let hp1Seen = false;
  state.employees.forEach(emp => {
    if (emp.alive && emp.hp <= 0) {
      emp.alive = false;
      state.stats.deathsThisRun++;
      meta.totalDeaths++;
      addLog(state, `【殉職】${emp.name}が職務中に死亡しました。`);
    } else if (emp.alive && emp.hp === 1) {
      hp1Seen = true;
    }
  });
  if (hp1Seen) state.stats.sawHp1Survivor = true;
}

function checkGameOverConditions() {
  const aliveCount = state.employees.filter(e => e.alive).length;
  if (aliveCount === 0) {
    state.gameOver = true;
    state.endReason = 'wipeout';
    state.stats.wipedOut = true;
  } else if (state.reputation <= 0) {
    state.gameOver = true;
    state.endReason = 'reputation';
  }
}

function endDay() {
  let allMet = true;
  WORKTYPES.forEach(w => {
    if (state.energy[w.key] >= state.quota[w.key]) {
      state.reputation = clamp(state.reputation + 3, 0, 200);
    } else {
      state.reputation = clamp(state.reputation - 8, 0, 200);
      allMet = false;
    }
  });
  const dayCoin = Math.floor(Object.values(state.energy).reduce((a, b) => a + b, 0) * 0.4) + 5;
  state.coin += dayCoin;
  addLog(state, `【日次決算】Day${state.day}終了。信頼度:${state.reputation} / 収入+${dayCoin}エンケファリン`);

  if (allMet) { state.stats.quotaStreak++; }
  else { state.stats.quotaStreak = 0; }

  // リセット
  WORKTYPES.forEach(w => { state.energy[w.key] = 0; });
  state.day++;
  state.phase = 1;

  if (meta.bestDay < state.day) meta.bestDay = state.day;

  // 新規搬入(3日おき)
  if (state.day % 3 === 0) {
    deliverAbnormality(state);
  }
  computeQuota(state);

  // 生存エージェントの自然回復
  state.employees.forEach(e => {
    if (e.alive) {
      e.sp = clamp(e.sp + 15, 0, e.maxSp);
      if (e.resting) {
        e.hp = e.maxHp; e.sp = e.maxSp; e.resting = false;
      }
    }
  });

  checkGameOverConditions();
  saveMeta();
  saveGame();
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---------- アクション ----------
function hireEmployee() {
  if (state.gameOver) return;
  const cost = 20 + state.employees.length * 15;
  if (state.coin < cost) { addLog(state, `【人事】資金が足りず雇用できません。(必要:${cost}エンケファリン)`); render(); return; }
  state.coin -= cost;
  const emp = randomEmployee();
  state.employees.push(emp);
  state.stats.hiresThisRun++;
  meta.totalHires++;
  addLog(state, `【採用】${emp.name}が新たに着任しました。`);
  runAchievementCheck();
  render();
}

function restEmployee(empId) {
  if (state.gameOver) return;
  const emp = state.employees.find(e => e.id === empId);
  if (!emp || !emp.alive) return;
  const cost = 15;
  if (state.coin < cost) { addLog(state, `【厚生】資金が足りず休養処置ができません。(必要:${cost}エンケファリン)`); render(); return; }
  state.coin -= cost;
  emp.hp = emp.maxHp;
  emp.sp = emp.maxSp;
  state.cells.forEach(c => { c.assigned = c.assigned.filter(id => id !== empId); });
  state.stats.restsThisRun++;
  meta.totalRests++;
  addLog(state, `【厚生】${emp.name}が休養処置を受け、心身ともに回復した。`);
  render();
}

function retireGame() {
  if (state.gameOver) return;
  state.gameOver = true;
  state.endReason = 'retire';
  state.stats.retired = true;
  finalizeRun();
  render();
}

function finalizeRun() {
  if (meta.bestDay < state.day) meta.bestDay = state.day;
  runAchievementCheck();
  saveMeta();
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

// ---------- 実績判定 ----------
function buildAggregateStats() {
  const uniqueContainedNow = new Set(meta.uniqueContained);
  state.cells.forEach(c => { if (c.abno) uniqueContainedNow.add(c.abno.id); });
  const containedTierMax = state.cells.reduce((m, c) => c.abno ? Math.max(m, c.abno.tier) : m, 0);
  const alephConcurrent = state.cells.filter(c => c.abno && c.abno.tier === 5 && !c.breached).length;
  const maxBreachOnSame = Object.values(state.stats.breachCountByAbno).reduce((a, b) => Math.max(a, b), 0);
  const deptCoverage = new Set(state.employees.filter(e => e.alive).map(e => e.department)).size;
  return {
    day: state.day,
    reputation: state.reputation,
    coin: state.coin,
    totalEnergyAllTime: meta.totalEnergyAllTime,
    totalHires: meta.totalHires,
    totalDeaths: meta.totalDeaths,
    totalBreachSuppressed: meta.totalBreachSuppressed,
    totalRests: meta.totalRests,
    deathsThisRun: state.stats.deathsThisRun,
    hiresThisRun: state.stats.hiresThisRun,
    restsThisRun: state.stats.restsThisRun,
    quotaStreak: state.stats.quotaStreak,
    uniqueContainedCount: uniqueContainedNow.size,
    containedTierMax,
    alephConcurrent,
    maxStatSeen: meta.maxStatSeen,
    maxCombatSeen: meta.maxCombatSeen,
    deptCoverage,
    tutorialDone: meta.tutorialSeen,
    currentRoster: state.employees.filter(e => e.alive).length,
    maxBreachOnSame,
    simulBreach: state.stats.simulBreachMax,
    retired: state.stats.retired,
    wipedOut: state.stats.wipedOut,
    sawHp1Survivor: state.stats.sawHp1Survivor,
    sawZeroSp: state.stats.sawZeroSp,
    allIdlePhase: state.stats.allIdlePhase,
  };
}

let newlyUnlocked = [];
function runAchievementCheck() {
  const agg = buildAggregateStats();
  // uniqueContainedを永続化
  state.cells.forEach(c => { if (c.abno && !meta.uniqueContained.includes(c.abno.id)) meta.uniqueContained.push(c.abno.id); });

  ACHIEVEMENTS.forEach(a => {
    if (meta.unlocked.includes(a.id)) return;
    let ok = false;
    try { ok = !!a.check(agg); } catch (e) { ok = false; }
    if (ok) {
      meta.unlocked.push(a.id);
      newlyUnlocked.push(a);
    }
  });
  if (newlyUnlocked.length > 0) saveMeta();
}

// ---------- セーブ/ロード ----------
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // idSeqの復元(既存IDと衝突しないように)
    let maxId = 0;
    s.employees.forEach(e => { if (e.id > maxId) maxId = e.id; });
    s.cells.forEach(c => { if (c.id > maxId) maxId = c.id; });
    idSeq = maxId + 1;
    return s;
  } catch (e) { return null; }
}

// ---------- 初期化フロー ----------
function startNewGame() {
  state = createNewState();
  deliverAbnormality(state); // 開始時点で1体追加搬入(合計4体)
  addLog(state, '施設の運営を開始します。エージェントを割り当ててアブノーマリティから作業エネルギーを取り出してください。');
  saveGame();
  render();
  if (window.Tutorial && !meta.tutorialSeen) {
    window.Tutorial.start(false);
  }
}

function continueGame() {
  const loaded = loadGame();
  if (loaded) { state = loaded; render(); return true; }
  return false;
}

function markTutorialSeen() {
  meta.tutorialSeen = true;
  saveMeta();
  runAchievementCheck();
  render();
}

window.LobotomyGame = {
  init() {
    meta = loadMeta();
    const hasSave = !!localStorage.getItem(SAVE_KEY);
    showTitleScreen(hasSave);
  },
  startNewGame,
  continueGame,
  selectEmployee,
  toggleAssign,
  nextPhase,
  hireEmployee,
  restEmployee,
  retireGame,
  markTutorialSeen,
};
