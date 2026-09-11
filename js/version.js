// ===== LOBOTOMY DELUXE - version.js =====
const GAME_VERSION = '1.1.0';

const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-09-12',
    changes: [
      'スポットライト式のインタラクティブ・チュートリアルを追加(タイトル画面・施設内の「📘チュートリアル」ボタンからいつでも再受講可能)。',
      '脱走の鎮圧専用ステータス「戦闘」をエージェントに追加(本能・洞察・愛着・抑圧とは別枠で成長)。',
      'エージェントに生命の樹(セフィロト)由来の配属部署フレーバーを追加。',
      '通貨表記を「エンケファリン」に変更、封印カウンターを「Qliphothカウンター」と明記するなど本家寄りの用語に統一。',
      '実績を追加(研修修了・鎮圧のエキスパート・生命の樹)し、全44種に。',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-12',
    changes: [
      '初回リリース。',
      'アブノーマリティ15種(ZAYIN〜ALEPH全5等級)を実装。',
      'エージェントの雇用・作業割り当て・休養システムを実装。',
      'アブノーマリティの脱走(収容違反)と鎮圧システムを実装。',
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
