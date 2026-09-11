// ===== LOBOTOMY DELUXE - data.js =====
// マスターデータ定義(アブノーマリティ/エージェント名プール/実績)

const TIERS = [
  { key: 'ZAYIN', label: 'ZAYIN', order: 1, color: '#7fd1ff' },
  { key: 'TETH',  label: 'TETH',  order: 2, color: '#7dffb0' },
  { key: 'HE',    label: 'HE',    order: 3, color: '#ffe066' },
  { key: 'WAW',   label: 'WAW',   order: 4, color: '#ff9a4d' },
  { key: 'ALEPH', label: 'ALEPH', order: 5, color: '#ff4d4d' },
];

const WORKTYPES = [
  { key: 'instinct',    label: '本能', color: '#ff5c5c', icon: '🔥' },
  { key: 'insight',     label: '洞察', color: '#4da3ff', icon: '👁' },
  { key: 'attachment',  label: '愛着', color: '#ffd24d', icon: '❤' },
  { key: 'repression',  label: '抑圧', color: '#e8e8e8', icon: '⛓' },
];

// カバラの生命の樹に由来する部署名(本家に倣った配属フレーバー)。
// 配列の並び順=施設のフロア順(マルクトが最上階=B1、ケテルが最深部)としても使う。
const SEPHIROT_DEPARTMENTS = [
  'マルクト', 'イェソド', 'ホド', 'ネツァク', 'ティファレト',
  'ゲブラー', 'ケセド', 'ビナー', 'ホクマー', 'ケテル',
];

function floorLabel(index) {
  return { num: 'B' + (index + 1), dept: SEPHIROT_DEPARTMENTS[index % SEPHIROT_DEPARTMENTS.length] };
}

function tierInfo(tierNum) {
  return TIERS[tierNum - 1];
}

// tier: 1=ZAYIN .. 5=ALEPH
const ABNORMALITIES = [
  // --- ZAYIN (tier1) ---
  { id: 'wordjar', name: 'コトダマの壺', tier: 1, types: ['insight', 'attachment'],
    desc: '話しかけると壺の中から知らない誰かの声で相槌が返ってくる、古い陶器の壺。' },
  { id: 'plushguard', name: 'ぬいぐるみの番兵', tier: 1, types: ['instinct', 'repression'],
    desc: '直立不動で立つ布製の人形。目を離すとわずかに向きを変えている。' },
  { id: 'eyeclock', name: '回転する目玉時計', tier: 1, types: ['insight', 'repression'],
    desc: '文字盤の代わりに大きな目玉がついた壁掛け時計。秒針の音に合わせて瞬きする。' },
  { id: 'laughbox', name: '笑う郵便受け', tier: 1, types: ['attachment', 'instinct'],
    desc: '手紙を入れるとくすくすと笑い声を漏らす郵便受け。中身は誰も見たことがない。' },

  // --- TETH (tier2) ---
  { id: 'cranes', name: '無数の折り紙鶴', tier: 2, types: ['insight', 'attachment'],
    desc: '千羽を優に超える折り鶴の山。数えるたびに数が合わない。' },
  { id: 'confession', name: '錆びた懺悔室', tier: 2, types: ['repression', 'attachment'],
    desc: '木製の懺悔室。格子の向こうから、こちらの秘密を言い当てる囁きが聞こえる。' },
  { id: 'upsidechild', name: '逆さまの子供', tier: 2, types: ['instinct', 'insight'],
    desc: '天井に張り付くように佇む子供の影。床を歩くエージェントを静かに見下ろしている。' },
  { id: 'throatless', name: '喉なし歌手', tier: 2, types: ['attachment', 'repression'],
    desc: '喉のない姿でありながら美しい歌声を響かせる歌手。歌が止むと室温が下がる。' },

  // --- HE (tier3) ---
  { id: 'nurse1000', name: '千の腕を持つ看護師', tier: 3, types: ['instinct', 'repression'],
    desc: '白衣の下に無数の腕を隠し持つ看護師。優しく、そして少しだけ数が多すぎる。' },
  { id: 'wallshadow', name: '壁を這う影法師', tier: 3, types: ['insight', 'instinct'],
    desc: '光源の位置を無視して壁や天井を這い回る人型の影。輪郭だけが妙にはっきりしている。' },
  { id: 'emptycrown', name: '空になった王冠', tier: 3, types: ['attachment', 'repression'],
    desc: '誰も被っていないのに、たまに傾いている金属の王冠。近づく者に「跪け」と囁く。' },

  // --- WAW (tier4) ---
  { id: 'redraingirl', name: '赤い雨を降らす少女', tier: 4, types: ['instinct', 'attachment'],
    desc: '傘も差さずに佇む少女。その周囲だけ、ぽつぽつと赤い雨が降り続けている。' },
  { id: 'banquet', name: '終わらない晩餐会', tier: 4, types: ['insight', 'attachment'],
    desc: '豪奢な食卓に着いた招待客たちは、何百年も同じ乾杯を続けているように見える。' },

  // --- ALEPH (tier5) ---
  { id: 'doorbeyond', name: '扉の向こうの扉', tier: 5, types: ['instinct', 'insight', 'attachment', 'repression'],
    desc: '開けても開けても、その先にまったく同じ扉が続いている。ノックの音は内側から聞こえる。' },
  { id: 'blankbible', name: '白紙の聖書', tier: 5, types: ['instinct', 'insight', 'attachment', 'repression'],
    desc: '一文字も書かれていない聖典。読もうとした者は、代わりに自分の記憶を朗読し始める。' },
];

// tierごとの基礎パラメータ(difficulty=必要熟練度の目安, energy=1回成功あたりの供給量,
// qliphoth=耐久回数, breachPower=脱走時の攻撃力, suppressReq=再収容に必要な鎮圧ポイント)
const TIER_PARAMS = {
  1: { difficulty: 2, energy: 2,  qliphoth: 5, breachPower: 6,  suppressReq: 2 },
  2: { difficulty: 4, energy: 4,  qliphoth: 4, breachPower: 10, suppressReq: 3 },
  3: { difficulty: 6, energy: 6,  qliphoth: 3, breachPower: 16, suppressReq: 4 },
  4: { difficulty: 7, energy: 9,  qliphoth: 2, breachPower: 24, suppressReq: 6 },
  5: { difficulty: 9, energy: 13, qliphoth: 1, breachPower: 34, suppressReq: 8 },
};

// エージェント名プール
const SURNAMES = ['佐藤','鈴木','高橋','田中','伊藤','渡辺','山本','中村','小林','加藤',
  '吉田','山田','佐々木','山口','松本','井上','木村','林','清水','斎藤',
  '橋本','石川','前田','藤田','岡田','長谷川','村上','近藤','石井','坂本'];
const GIVEN_NAMES = ['陽菜','翔太','結衣','大輝','美咲','健太','さくら','蓮','愛','拓海',
  '真央','悠斗','優子','大和','千尋','航','美月','蒼','桃子','剛'];

const EMPLOYEE_QUOTES = [
  '「今日も定時で帰りたいです」',
  '「あの壺、目が合った気がするんですよね」',
  '「給料日まであと何日でしたっけ」',
  '「休憩室のコーヒーが薄いです」',
  '「マニュアル通りにやってるだけです」',
  '「昨日から左耳の調子が悪くて」',
  '「これって労災おりますか」',
  '「エージェント食堂のカレー、また出ました」',
  '「早く昇進したいんですけどね」',
  '「別に、怖くなんかないです」',
];

// 実績定義。check(agg) の agg は集計済みステータス(現在ラン+永続)
const ACHIEVEMENTS = [
  { id: 'day3',    name: '見習い管理官',   desc: '3日間、施設の運営を続ける',        check: a => a.day >= 3 },
  { id: 'day7',    name: '一週間生存',     desc: '7日間、施設の運営を続ける',        check: a => a.day >= 7 },
  { id: 'day15',   name: '半月選手',       desc: '15日間、施設の運営を続ける',       check: a => a.day >= 15 },
  { id: 'day30',   name: 'ひと月選手',     desc: '30日間、施設の運営を続ける',       check: a => a.day >= 30 },
  { id: 'day50',   name: '生きる伝説',     desc: '50日間、施設の運営を続ける',       check: a => a.day >= 50 },

  { id: 'energy100',  name: '駆け出しの電力', desc: '累計エネルギーを100供給する',      check: a => a.totalEnergyAllTime >= 100 },
  { id: 'energy1000', name: '安定供給',       desc: '累計エネルギーを1000供給する',     check: a => a.totalEnergyAllTime >= 1000 },
  { id: 'energy10000',name: '街を灯す力',     desc: '累計エネルギーを10000供給する',    check: a => a.totalEnergyAllTime >= 10000 },

  { id: 'hire5',   name: '採用担当',       desc: '累計5人を雇用する',        check: a => a.totalHires >= 5 },
  { id: 'hire20',  name: '人事部長',       desc: '累計20人を雇用する',       check: a => a.totalHires >= 20 },
  { id: 'hire50',  name: '大量採用',       desc: '累計50人を雇用する',       check: a => a.totalHires >= 50 },

  { id: 'death1',  name: '初めての犠牲',   desc: 'エージェントを1人失う(悲しい実績)',  check: a => a.totalDeaths >= 1 },
  { id: 'death10', name: '労働災害多発',   desc: 'エージェントを累計10人失う',        check: a => a.totalDeaths >= 10 },
  { id: 'noDeathDay10', name: '無事故記録', desc: '誰も死なせずに10日を迎える', check: a => a.day >= 10 && a.deathsThisRun === 0 },

  { id: 'suppress1',  name: '鎮圧初経験',   desc: '脱走したアブノーマリティを1体鎮圧する',  check: a => a.totalBreachSuppressed >= 1 },
  { id: 'suppress10', name: 'ベテラン鎮圧班', desc: '脱走したアブノーマリティを累計10体鎮圧する', check: a => a.totalBreachSuppressed >= 10 },

  { id: 'containUnique5',  name: '収容管理官',   desc: '異なるアブノーマリティを5種類収容する',  check: a => a.uniqueContainedCount >= 5 },
  { id: 'containUnique10', name: 'コレクター',   desc: '異なるアブノーマリティを10種類収容する', check: a => a.uniqueContainedCount >= 10 },
  { id: 'containAll',      name: 'フルコンプリート', desc: '全15種のアブノーマリティを収容する', check: a => a.uniqueContainedCount >= 15 },

  { id: 'aleph1', name: 'ALEPH解禁',   desc: 'ALEPH等級のアブノーマリティを初めて収容する', check: a => a.containedTierMax >= 5 },
  { id: 'aleph3', name: 'ALEPH管理者', desc: 'ALEPH等級を3体同時に収容する',      check: a => a.alephConcurrent >= 3 },

  { id: 'reputation150', name: '経営優良企業', desc: '信頼度が150に到達する',   check: a => a.reputation >= 150 },
  { id: 'reputation0',   name: '倒産寸前',     desc: '信頼度が0になる(バッドエンド)', check: a => a.reputation <= 0 && a.day > 0 },

  { id: 'coin500',  name: '小金持ち',   desc: '所持エンケファリンが500に到達する',  check: a => a.coin >= 500 },
  { id: 'coin2000', name: '資金潤沢',   desc: '所持エンケファリンが2000に到達する', check: a => a.coin >= 2000 },

  { id: 'levelmax1', name: '熟練エージェント',   desc: 'いずれかの能力値が9に到達したエージェントが生まれる', check: a => a.maxStatSeen >= 9 },
  { id: 'roster10',  name: '大所帯',     desc: '在籍エージェント数が10人になる',   check: a => a.currentRoster >= 10 },
  { id: 'roster20',  name: '巨大組織',   desc: '在籍エージェント数が20人になる',   check: a => a.currentRoster >= 20 },

  { id: 'quotaStreak5',  name: '安定経営',   desc: 'ノルマを5日連続で達成する',  check: a => a.quotaStreak >= 5 },
  { id: 'quotaStreak10', name: '完璧な運営', desc: 'ノルマを10日連続で達成する', check: a => a.quotaStreak >= 10 },

  { id: 'breachSame3', name: '脱走の常連', desc: '同じアブノーマリティを3回脱走させる',  check: a => a.maxBreachOnSame >= 3 },
  { id: 'criticalFail1', name: '最悪の一日', desc: '1フェーズで2体同時に脱走する', check: a => a.simulBreach >= 2 },

  { id: 'firstDay', name: '初出勤',   desc: 'ゲームを開始する',        check: a => a.day >= 1 },
  { id: 'retire',   name: '円満退社', desc: '自らの意思で施設運営を終了する', check: a => a.retired === true },
  { id: 'wipeout',  name: '全滅エンド', desc: 'エージェントが全員いなくなり運営が破綻する', check: a => a.wipedOut === true },

  { id: 'hp0survive', name: '紙一重', desc: 'HPが1のエージェントが生き残って1日を終える', check: a => a.sawHp1Survivor === true },
  { id: 'sp0', name: '限界突破', desc: '正気度が0になったエージェントが現れる', check: a => a.sawZeroSp === true },
  { id: 'noHireRun10', name: '少数精鋭', desc: '一度も雇用せずに10日生存する', check: a => a.day >= 10 && a.hiresThisRun === 0 },
  { id: 'allIdleOnce', name: 'サボり癖', desc: '1フェーズ、誰も作業に割り当てずに進める', check: a => a.allIdlePhase === true },
  { id: 'restUsed10', name: '福利厚生の鑑', desc: '休養処置を累計10回使う', check: a => a.totalRests >= 10 },
  { id: 'nightOwl', name: '不眠不休', desc: '休養処置を一度も使わずに20日生存する', check: a => a.day >= 20 && a.restsThisRun === 0 },
  { id: 'tutorialDone', name: '研修修了', desc: 'チュートリアルを最後まで受ける', check: a => a.tutorialDone === true },
  { id: 'combat9', name: '鎮圧のエキスパート', desc: '戦闘値が9のエージェントが生まれる', check: a => a.maxCombatSeen >= 9 },
  { id: 'allDepts', name: '生命の樹', desc: '10部署すべての出身エージェントを在籍させる', check: a => a.deptCoverage >= 10 },
];
