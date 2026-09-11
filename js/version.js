// ===== LOBOTOMY DELUXE - version.js =====
const GAME_VERSION = '1.3.0';

const CHANGELOG = [
  {
    version: '1.3.0',
    date: '2026-09-12',
    changes: [
      'WebAudio合成の効果音を全面追加(選択/割当/Good・Normal・Badの作業結果/警報サイレン/鎮圧成否/殉職/日次決算/雇用/休養/実績解除/ゲームオーバー)。ヘッダーの🔊ボタンでON/OFF切替可能。',
      'フローティングテキスト・セルシェイク・画面フラッシュ・脱走中の画面ビネットなど演出を大幅追加。',
      'DAY/信頼度/エンケファリンの数値をアニメーションでカウントアップ表示するように変更。',
      'タイトル画面にスキャンライン・フリッカー演出を追加。',
      'アブノーマリティを5種追加し全20種に(フルコンプリート実績の条件も更新)。',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-09-12',
    changes: [
      '施設フロア図をエレベーター断面風のフロア別レイアウトに刷新(B1〜、各階にセフィロト部署名を表示)。',
      '作業結果を◎Good/○Normal/×Badの3段階判定に変更(Goodほど多くエネルギーを獲得、封印カウンターの減少はBadエンド時のみ)。',
      '本能・洞察・愛着・抑圧の4エネルギーに絵文字アイコン(🔥👁❤⛓)を追加。',
      '日次決算を専用モーダルで表示するように変更(ノルマ達成状況・信頼度増減・収入・新規搬入を一覧表示)。',
      '収容違反(脱走)発生中は画面上部に警報バナーを表示するように変更。',
    ],
  },
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
