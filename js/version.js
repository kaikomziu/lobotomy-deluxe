// ===== LOBOTOMY DELUXE - version.js =====
const GAME_VERSION = '1.0.0';

const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2026-09-12',
    changes: [
      '初回リリース。',
      '収容体15種(ZAYIN〜ALEPH全5等級)を実装。',
      '職員の雇用・作業割り当て・休養システムを実装。',
      '収容体の脱走(収容違反)と鎮圧システムを実装。',
      '実績41種を実装。',
    ],
  },
];

document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('version-badge');
  if (badge) badge.textContent = 'v' + GAME_VERSION;

  const wrap = document.getElementById('changelog-list');
  if (wrap) {
    wrap.innerHTML = CHANGELOG.map(entry => `
      <div class="changelog-entry">
        <div class="changelog-head">v${entry.version} <span class="changelog-date">${entry.date}</span></div>
        <ul class="changelog-changes">
          ${entry.changes.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }
});
