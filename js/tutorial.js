// ===== LOBOTOMY DELUXE - tutorial.js =====
// スポットライト式のインタラクティブ・チュートリアル。
// state / meta / render() / clamp() は game.js / ui.js のグローバルを利用する。

const TUTORIAL_STEPS = [
  {
    target: null,
    title: 'ようこそ、管理官',
    body: 'あなたはこの施設の管理官です。得体の知れない「アブノーマリティ」にエージェントを割り当てて作業させ、施設を維持するためのエネルギーを取り出すのが仕事です。全10ステップ、実際に操作しながら覚えましょう。',
  },
  {
    target: '#top-bar',
    title: '施設の状況',
    body: 'DAY(経過日数)とPHASE(1日3回の作業フェーズ)、信頼度(0になると運営終了)、そしてエンケファリン(雇用や休養に使う資金)がここに表示されます。',
  },
  {
    target: '#quota-panel',
    title: '本日のノルマ',
    body: '本能・洞察・愛着・抑圧の4種類の作業エネルギーには、それぞれ日ごとのノルマがあります。4種類すべて達成すると信頼度が上がり、未達成の種類が一つでもあると下がります。',
  },
  {
    target: '#cells-grid',
    title: 'アブノーマリティの収容セル',
    body: '等級バッジ(ZAYINが最も安全、ALEPHが最も危険)と、そのアブノーマリティが受け付ける作業タイプが表示されています。下の「Qliphothカウンター」が0になると「収容違反」を起こして脱走するので注意してください。',
  },
  {
    target: '#employee-list',
    title: 'エージェント',
    body: '本能・洞察・愛着・抑圧の4つの作業能力に加えて、脱走の鎮圧専用の「戦闘」能力を持っています。HPが0になると殉職、SPが下がりすぎると作業の成功率が落ちます。',
  },
  {
    target: '#employee-list',
    title: '実践① エージェントを選ぼう',
    body: 'まずはエージェントのカードを1つクリックして選択してみましょう。選択中のカードは赤い枠で囲まれます。',
    interactive: true,
    hint: '↑ 好きなエージェントのカードをクリック',
    isDone: () => !!(state && state.selectedEmployeeId),
  },
  {
    target: '#cells-grid',
    title: '実践② セルに割り当てよう',
    body: '選んだエージェントを、アブノーマリティが入っている収容セルにクリックして割り当てましょう。同じセルをもう一度クリックすると割り当てを解除できます。',
    interactive: true,
    hint: '↑ アブノーマリティのいるセルをクリック',
    isDone: () => !!(state && state.cells.some(c => c.assigned.length > 0)),
  },
  {
    target: '#next-phase-btn',
    title: '実践③ フェーズを進めよう',
    body: '割り当てが終わったら、このボタンでフェーズを進めましょう。割り当てたエージェントが作業を行い、成功すればエネルギーが手に入ります。実際に押してみてください。',
    interactive: true,
    hint: '↑ ボタンを押してフェーズを進める',
    onEnter: () => { tutorialCtx.dayPhaseKey = state ? state.day + '-' + state.phase : ''; },
    isDone: () => !!(state && (state.day + '-' + state.phase) !== tutorialCtx.dayPhaseKey),
  },
  {
    target: '#hire-btn',
    title: '雇用と休養',
    body: 'エンケファリンを消費して新しいエージェントを雇用できます(コストは在籍人数に応じて上昇)。負傷したエージェントは各カードの「休養」ボタンでその場で回復できます。',
  },
  {
    target: '#cells-grid',
    title: '脱走したら…',
    body: '作業に失敗し続けてQliphothカウンターが0になると、アブノーマリティは「収容違反」を起こして脱走します。放置すると待機中のエージェントを襲うので、「戦闘」ステータスを持つエージェントを割り当てて鎮圧しましょう。',
  },
  {
    target: '#retire-btn',
    title: '運営の終わり方',
    body: '信頼度が0になる、またはエージェントが全員いなくなると運営終了です。逆にキリのいいところで「運営終了」を押せば、いつでも自主的に記録を確定できます。',
  },
  {
    target: null,
    title: 'これで研修は終わりです',
    body: '実績は全41種類、アブノーマリティは全15種類。すべての収容を目指してみましょう。それでは、管理官としての仕事をどうぞ。',
  },
];

let tutorialActive = false;
let tutorialStepIndex = 0;
let tutorialCtx = {};

function tclamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function buildTutorialDom() {
  const root = document.getElementById('tutorial-root');
  if (!root || root.dataset.built) return;
  root.innerHTML = `
    <div id="tut-mask-top" class="tut-mask"></div>
    <div id="tut-mask-bottom" class="tut-mask"></div>
    <div id="tut-mask-left" class="tut-mask"></div>
    <div id="tut-mask-right" class="tut-mask"></div>
    <div id="tut-ring"></div>
    <div id="tut-tooltip">
      <div id="tut-progress"></div>
      <div id="tut-title"></div>
      <div id="tut-body"></div>
      <div id="tut-hint"></div>
      <div id="tut-buttons">
        <button id="tut-skip" type="button">スキップ</button>
        <button id="tut-prev" type="button">戻る</button>
        <button id="tut-next" type="button">次へ</button>
      </div>
    </div>
  `;
  root.dataset.built = '1';

  document.getElementById('tut-next').addEventListener('click', () => {
    const step = TUTORIAL_STEPS[tutorialStepIndex];
    if (step.interactive && !(step.isDone && step.isDone())) return;
    if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) { finishTutorial(); return; }
    tutorialStepIndex++;
    renderTutorialStep();
  });
  document.getElementById('tut-prev').addEventListener('click', () => {
    if (tutorialStepIndex > 0) { tutorialStepIndex--; renderTutorialStep(); }
  });
  document.getElementById('tut-skip').addEventListener('click', () => finishTutorial());

  window.addEventListener('resize', () => {
    if (tutorialActive) positionForStep(TUTORIAL_STEPS[tutorialStepIndex]);
  });
}

function applyMasks(rect, pad) {
  const top = document.getElementById('tut-mask-top');
  const bottom = document.getElementById('tut-mask-bottom');
  const left = document.getElementById('tut-mask-left');
  const right = document.getElementById('tut-mask-right');
  const ring = document.getElementById('tut-ring');
  const vw = window.innerWidth, vh = window.innerHeight;

  if (!rect) {
    top.style.cssText = `display:block;left:0;top:0;width:${vw}px;height:${vh}px;`;
    bottom.style.cssText = 'display:none;';
    left.style.cssText = 'display:none;';
    right.style.cssText = 'display:none;';
    ring.style.display = 'none';
    return;
  }
  const rt = tclamp(rect.top - pad, 0, vh);
  const rb = tclamp(rect.bottom + pad, 0, vh);
  const rl = tclamp(rect.left - pad, 0, vw);
  const rr = tclamp(rect.right + pad, 0, vw);

  top.style.cssText = `display:block;left:0;top:0;width:${vw}px;height:${rt}px;`;
  bottom.style.cssText = `display:block;left:0;top:${rb}px;width:${vw}px;height:${Math.max(vh - rb, 0)}px;`;
  left.style.cssText = `display:block;left:0;top:${rt}px;width:${rl}px;height:${Math.max(rb - rt, 0)}px;`;
  right.style.cssText = `display:block;left:${rr}px;top:${rt}px;width:${Math.max(vw - rr, 0)}px;height:${Math.max(rb - rt, 0)}px;`;
  ring.style.cssText = `display:block;left:${rl}px;top:${rt}px;width:${Math.max(rr - rl, 0)}px;height:${Math.max(rb - rt, 0)}px;`;
}

function positionTooltip(rect) {
  const tip = document.getElementById('tut-tooltip');
  const vh = window.innerHeight, vw = window.innerWidth;
  const tipW = Math.min(340, vw - 24);
  tip.style.width = tipW + 'px';

  if (!rect) {
    tip.style.cssText = `left:50%;top:50%;transform:translate(-50%,-50%);width:${tipW}px;`;
    return;
  }

  // 実測サイズで、対象を隠さない位置(下→上→右→左→やむを得ず重なる場合は最も余白が広い側)を選ぶ
  const tipH = tip.offsetHeight || 220;
  const gap = 16;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = vw - rect.right;
  const spaceLeft = rect.left;

  let left, top;
  if (spaceBelow >= tipH + gap) {
    top = rect.bottom + gap;
    left = tclamp(rect.left, 8, Math.max(vw - tipW - 8, 8));
  } else if (spaceAbove >= tipH + gap) {
    top = rect.top - gap - tipH;
    left = tclamp(rect.left, 8, Math.max(vw - tipW - 8, 8));
  } else if (spaceRight >= tipW + gap) {
    left = rect.right + gap;
    top = tclamp(rect.top, 8, Math.max(vh - tipH - 8, 8));
  } else if (spaceLeft >= tipW + gap) {
    left = rect.left - gap - tipW;
    top = tclamp(rect.top, 8, Math.max(vh - tipH - 8, 8));
  } else {
    // どの向きにも収まらない場合は、最も余白の広い側へ最大限寄せる(重なりは最小化)
    const best = Math.max(spaceBelow, spaceAbove, spaceRight, spaceLeft);
    if (best === spaceBelow) { top = vh - tipH - 8; left = tclamp(rect.left, 8, Math.max(vw - tipW - 8, 8)); }
    else if (best === spaceAbove) { top = 8; left = tclamp(rect.left, 8, Math.max(vw - tipW - 8, 8)); }
    else if (best === spaceRight) { left = vw - tipW - 8; top = tclamp(rect.top, 8, Math.max(vh - tipH - 8, 8)); }
    else { left = 8; top = tclamp(rect.top, 8, Math.max(vh - tipH - 8, 8)); }
  }
  tip.style.cssText = `left:${left}px;top:${top}px;transform:none;width:${tipW}px;`;
}

function positionForStep(step) {
  const targetEl = step.target ? document.querySelector(step.target) : null;
  let rect = null;
  if (targetEl) {
    targetEl.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
    rect = targetEl.getBoundingClientRect();
  }
  applyMasks(rect, 8);
  positionTooltip(rect);
}

function updateInteractiveState(step) {
  const nextBtn = document.getElementById('tut-next');
  const hintEl = document.getElementById('tut-hint');
  if (!step.interactive) {
    hintEl.style.display = 'none';
    nextBtn.disabled = false;
    nextBtn.textContent = tutorialStepIndex === TUTORIAL_STEPS.length - 1 ? '始める' : '次へ';
    return;
  }
  const done = !!(step.isDone && step.isDone());
  hintEl.style.display = 'block';
  hintEl.textContent = done ? '✓ できました！' : (step.hint || '');
  hintEl.className = done ? 'tut-hint-done' : 'tut-hint-pending';
  nextBtn.disabled = !done;
  nextBtn.textContent = done ? '次へ' : '（操作してください）';
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStepIndex];
  document.getElementById('tut-progress').textContent = `STEP ${tutorialStepIndex + 1} / ${TUTORIAL_STEPS.length}`;
  document.getElementById('tut-title').textContent = step.title;
  document.getElementById('tut-body').textContent = step.body;
  document.getElementById('tut-prev').style.display = tutorialStepIndex === 0 ? 'none' : 'inline-block';

  if (step.onEnter) step.onEnter();
  updateInteractiveState(step);
  positionForStep(step);
}

function onGameRenderForTutorial() {
  if (!tutorialActive) return;
  const step = TUTORIAL_STEPS[tutorialStepIndex];
  updateInteractiveState(step);
  positionForStep(step);
}

function startTutorial(force) {
  if (!state) return;
  if (tutorialActive) return;
  if (!force && meta.tutorialSeen) return;
  buildTutorialDom();
  tutorialActive = true;
  tutorialStepIndex = 0;
  document.getElementById('tutorial-root').style.display = 'block';
  renderTutorialStep();
}

function finishTutorial() {
  tutorialActive = false;
  const root = document.getElementById('tutorial-root');
  if (root) root.style.display = 'none';
  if (window.LobotomyGame) window.LobotomyGame.markTutorialSeen();
}

// ui.js の render() をフックして、ゲーム側の状態変化にツアーを追従させる
(function hookRender() {
  const original = window.render;
  if (typeof original !== 'function') return;
  window.render = function () {
    original.apply(this, arguments);
    onGameRenderForTutorial();
  };
})();

window.Tutorial = { start: startTutorial };

document.addEventListener('DOMContentLoaded', () => {
  const titleBtn = document.getElementById('title-tutorial-btn');
  if (titleBtn) {
    titleBtn.addEventListener('click', () => {
      hideTitleScreen();
      window.LobotomyGame.startNewGame();
      window.Tutorial.start(true);
    });
  }
  const headerBtn = document.getElementById('tutorial-btn');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => window.Tutorial.start(true));
  }
});
