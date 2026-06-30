// ============================================================
//  Margarita — оркестратор 2D-мира
// ============================================================
import * as store from './store.js';
import { createWorld } from './world.js';
import { LOCATIONS, FORMATS, pickWords, isNew, makeDialogue } from './locations.js';
import { runIntro, runGame, runDialogue } from './minigames.js';
import { avatarSVG, COSMETICS, UPGRADES } from './avatar.js';

const LANG_OPTIONS = [
  { code: 'es', flag: '🇪🇸', name: 'Испанский', sub: 'español' },
  { code: 'en', flag: '🇺🇸', name: 'Английский', sub: 'English (American)' },
  { code: 'de', flag: '🇩🇪', name: 'Немецкий', sub: 'Deutsch' },
];

const $ = (s, r = document) => r.querySelector(s);
const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };

let world = null;
const gameRotation = {};

// ---------- HUD ----------
function hud() {
  const g = store.getGame();
  const xp = store.xpProgress(g.xp);
  $('#hud').innerHTML = `
    <div class="hud-left">
      <img src="./icons/icon.svg" class="brand-logo" alt="">
      <div class="hud-lvl"><span>⭐ ${g.level}</span><div class="hud-xp-bar"><i style="width:${xp.pct}%"></i></div></div>
    </div>
    <div class="hud-right">
      <span class="hud-chip">🪙 ${g.coins}</span>
      <span class="hud-chip ${g.streak > 0 ? 'fire' : ''}">🔥 ${g.streak}</span>
      <button class="hud-ic" id="btnShop">🛍️</button>
      <button class="hud-ic" id="btnSettings">⚙️</button>
    </div>`;
  $('#btnShop').onclick = () => openOverlay(screenShop);
  $('#btnSettings').onclick = () => openOverlay(screenSettings);
}

// ---------- мир ----------
function showAction(nearby) {
  const b = $('#actionBtn');
  if (nearby) { b.textContent = nearby.label; b.classList.remove('hidden'); }
  else b.classList.add('hidden');
}

async function enterLocation(loc) {
  if (loc.id === 'casino') { await enterCasino(); return; }
  world.pause(); $('#actionBtn').classList.add('hidden');
  try {
    const cards = pickWords(loc.themes, 6);
    if (!cards.length) { toast('Здесь сейчас нечего повторять 👌'); return; }
    const fresh = cards.filter(isNew);
    if (fresh.length) await runIntro(fresh);
    const idx = (gameRotation[loc.id] || 0) % loc.games.length;
    gameRotation[loc.id] = idx + 1;
    const res = await runGame(loc.games[idx], cards);
    store.markStudied(); hud();
    summary(loc, res);
  } finally { world.resume(); }
}

async function talkNPC(npc) {
  world.pause(); $('#actionBtn').classList.add('hidden');
  try {
    const dlg = makeDialogue();
    const res = await runDialogue(dlg);
    store.markStudied(); hud();
    const BIEN = { es: '¡Bien!', en: 'Well done!', de: 'Gut!' };
    if (res.coins) toast(`${res.correct ? '✓ ' + (BIEN[store.getGame().lang] || '✓') : 'Почти!'} +${res.coins} 🪙`);
  } finally { world.resume(); }
}

const todayKey = () => store.todayKey();
function isChestOpen(id) { return store.getGame().openedChests[id] === todayKey(); }

async function openChest(chest) {
  world.pause(); $('#actionBtn').classList.add('hidden');
  try {
    if (chest.secret) {
      const code = prompt('🔒 Введи секретный код:');
      if (code === '1805') {
        store.addRewards(20000, 0);
        store.save(); hud();
        toast('🎊 +20 000 🪙');
      } else if (code !== null) {
        toast('❌ Неверный код');
      }
      return;
    }
    const loc = LOCATIONS[(Math.random() * LOCATIONS.length) | 0];
    const fmt = FORMATS[(Math.random() * FORMATS.length) | 0];
    const cards = pickWords(loc.themes, 5);
    if (!cards.length) { toast('Сундук пока пуст 🙂'); return; }
    toast(`🎁 Сундук: ${loc.name}`);
    const fresh = cards.filter(isNew); if (fresh.length) await runIntro(fresh);
    const res = await runGame(fmt, cards);
    const bonus = 12 + (res.correct || 0) * 2;
    store.addRewards(bonus, 6);
    store.getGame().openedChests[chest.id] = todayKey();
    store.markStudied(); store.save(); hud();
    summary({ name: 'Сундук 🎁', emoji: '🎁' }, { total: res.total, correct: res.correct, coins: (res.coins || 0) + bonus });
  } finally { world.resume(); }
}

function summary(loc, res) {
  const acc = res.total ? Math.round((res.correct / res.total) * 100) : 0;
  const ov = el(`<div class="mg-overlay"><div class="mg-card">
    <div class="done2">
      <div class="done2-emoji">${loc.emoji}</div>
      <h2>${loc.name}</h2>
      <div class="done2-stats">
        <div><b>${res.total}</b><span>слов</span></div>
        <div><b>${acc}%</b><span>точность</span></div>
        <div><b>+${res.coins}</b><span>монет 🪙</span></div>
      </div>
      <button class="mg-btn" id="done2Btn">Дальше</button>
    </div></div></div>`);
  document.body.appendChild(ov);
  ov.querySelector('#done2Btn').onclick = () => ov.remove();
}

// ---------- оверлеи (магазин / настройки) ----------
function openOverlay(renderFn) {
  world && world.pause();
  const ov = $('#overlay'); ov.classList.remove('hidden'); ov.replaceChildren();
  renderFn(ov);
}
function closeOverlay() {
  const ov = $('#overlay'); ov.classList.add('hidden'); ov.replaceChildren();
  if (world) { world.setLook(store.getGame().avatar); world.resume(); }
}

// ---------- МАГАЗИН ----------
let shopTab = 'avatar';
function screenShop(ov) {
  const g = store.getGame();
  const tabs = [['avatar', '🧑 Персонаж'], ['boost', '⚡ Улучшения']];
  let body = '';
  if (shopTab === 'avatar') {
    const cats = [...new Set(COSMETICS.map(i => i.cat))];
    const groups = cats.map(cat => {
      const items = COSMETICS.filter(i => i.cat === cat).map(i => shopItemHTML(i, {
        owned: store.owns(i.id), equipped: g.avatar[i.slot] === i.val, coins: g.coins,
      })).join('');
      return `<div class="shop-cat">${cat}</div><div class="shop-grid">${items}</div>`;
    }).join('');
    body = `<div class="avatar-preview">${avatarSVG(g.avatar)}</div>${groups}`;
  } else {
    body = `<p class="screen-lead">Улучшения за монеты 🪙</p><div class="upgrade-list">${UPGRADES.map(u => upgradeHTML(u, g)).join('')}</div>`;
  }
  const scr = el(`<div class="screen shop-screen">
    <div class="ov-head"><button class="ov-back" id="ovBack">‹ Назад</button><h2 class="screen-title">🛍️ Магазин</h2><div class="shop-coins">🪙 ${g.coins}</div></div>
    <div class="shop-tabs">${tabs.map(([k, n]) => `<button class="shop-tab ${shopTab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
    <div class="shop-body">${body}</div>
  </div>`);
  ov.replaceChildren(scr);
  $('#ovBack').onclick = closeOverlay;
  scr.querySelectorAll('.shop-tab').forEach(b => b.onclick = () => { shopTab = b.dataset.tab; screenShop(ov); });
  scr.querySelectorAll('.shop-item[data-buy]').forEach(b => b.onclick = () => { buyCosmetic(b.dataset.buy); screenShop(ov); });
  scr.querySelectorAll('.upgrade-buy').forEach(b => b.onclick = () => { buyUpgrade(b.dataset.up); screenShop(ov); });
}
function shopItemHTML(i, { owned, equipped, coins }) {
  const can = owned || coins >= i.cost;
  const tag = equipped ? '<span class="si-tag eq">✓ надето</span>'
    : owned ? '<span class="si-tag own">надеть</span>'
      : `<span class="si-tag ${can ? '' : 'no'}">🪙 ${i.cost}</span>`;
  return `<button class="shop-item ${equipped ? 'equipped' : ''} ${!can && !owned ? 'locked' : ''}" data-buy="${i.id}">
    <span class="si-emoji">${i.emoji || '🎴'}</span><span class="si-name">${i.name}</span>${tag}</button>`;
}
function upgradeHTML(u, g) {
  let status = '', actionable = true;
  if (u.type === 'hint') { if (g.boosts.hint) { status = 'куплено'; actionable = false; } }
  else if (u.type === 'freeze') { status = `есть: ${g.boosts.freezes}/${u.max}`; if (g.boosts.freezes >= u.max) actionable = false; }
  else if (u.type === 'newPerDay') { status = g.boosts.extraNewPerDay ? `сейчас +${g.boosts.extraNewPerDay}/день` : ''; }
  else if (u.type === 'double') { status = g.boosts.doubleLeft ? `активно: ${g.boosts.doubleLeft} карт` : ''; }
  const can = actionable && g.coins >= u.cost;
  return `<div class="upgrade-row"><span class="up-emoji">${u.emoji}</span>
    <span class="up-mid"><span class="up-name">${u.name}</span><span class="up-desc">${u.desc}</span>${status ? `<span class="up-status">${status}</span>` : ''}</span>
    <button class="upgrade-buy ${!can ? 'dis' : ''}" data-up="${u.id}" ${!actionable ? 'disabled' : ''}>${!actionable ? '✓' : `🪙 ${u.cost}`}</button></div>`;
}
function buyCosmetic(id) {
  const g = store.getGame(); const c = COSMETICS.find(x => x.id === id); if (!c) return;
  if (store.owns(id)) { store.setAvatarPart(c.slot, c.val); return; }
  if (!store.spend(c.cost)) { toast('Не хватает монет 🪙'); return; }
  store.addOwned(id); store.setAvatarPart(c.slot, c.val); store.save(); hud(); toast('✨ Куплено и надето!');
}
function buyUpgrade(id) {
  const g = store.getGame(); const u = UPGRADES.find(x => x.id === id); if (!u) return;
  if (u.type === 'hint' && g.boosts.hint) return;
  if (u.type === 'freeze' && g.boosts.freezes >= u.max) { toast('Максимум заморозок'); return; }
  if (!store.spend(u.cost)) { toast('Не хватает монет 🪙'); return; }
  if (u.type === 'newPerDay') g.boosts.extraNewPerDay += 5;
  else if (u.type === 'freeze') g.boosts.freezes += 1;
  else if (u.type === 'hint') g.boosts.hint = true;
  else if (u.type === 'double') g.boosts.doubleLeft += 10;
  store.save(); hud(); toast('⚡ Улучшение активно!');
}

// ---------- НАСТРОЙКИ ----------
function screenSettings(ov) {
  const g = store.getGame();
  const curLang = LANG_OPTIONS.find(l => l.code === g.lang) || LANG_OPTIONS[0];
  const voiceTestPhrases = { es: 'hola, ¿qué tal?', en: 'Hello, how are you?', de: 'Hallo, wie geht es dir?' };
  const scr = el(`<div class="screen settings-screen">
    <div class="ov-head"><button class="ov-back" id="ovBack">‹ Назад</button><h2 class="screen-title">⚙️ Настройки</h2><div></div></div>
    <div class="set-row"><label>🌍 Язык для изучения</label><div class="seg lang-seg">
      ${LANG_OPTIONS.map(l => `<button class="seg-btn ${g.lang === l.code ? 'on' : ''}" data-lang="${l.code}">${l.flag} ${l.name}</button>`).join('')}
    </div></div>
    <div class="set-row"><label>🔊 Озвучка слов</label><button class="toggle ${g.settings.sound ? 'on' : ''}" id="tSound"><span></span></button></div>
    <div class="set-row"><label>🎙️ Голос носителя</label><div class="seg">
      <button class="seg-btn ${g.settings.voice !== 'male' ? 'on' : ''}" data-voice="female">♀ Женский</button>
      <button class="seg-btn ${g.settings.voice === 'male' ? 'on' : ''}" data-voice="male">♂ Мужской</button></div></div>
    <div class="set-row"><label>🧍 Персонаж</label><div class="seg">
      <button class="seg-btn ${g.avatar.gender !== 'm' ? 'on' : ''}" data-gender="f">👧 Девочка</button>
      <button class="seg-btn ${g.avatar.gender === 'm' ? 'on' : ''}" data-gender="m">👦 Мальчик</button></div></div>
    <div class="set-row col"><label>🆕 Новых слов в день (база): <b id="npdVal">${g.newPerDay}</b></label>
      <input type="range" min="5" max="40" step="5" value="${g.newPerDay}" id="npd">
      ${g.boosts.extraNewPerDay ? `<span class="set-note">+${g.boosts.extraNewPerDay} из магазина · итого ${store.effectiveNewPerDay()}/день</span>` : ''}</div>
    <div class="set-stats">
      <div><b>${g.bestStreak}</b><span>рекорд 🔥</span></div>
      <div><b>${g.daysStudied}</b><span>дней</span></div>
      <div><b>${store.xpProgress(g.xp).lvl}</b><span>уровень ⭐</span></div>
    </div>
    <div class="sync-section">
      <div class="sync-title">☁️ Синхронизация прогресса</div>
      <p class="screen-lead">Скопируй код и вставь на другом устройстве чтобы перенести прогресс.</p>
      <textarea class="sync-code" id="syncCode" readonly rows="3">${store.syncExport()}</textarea>
      <div class="sync-btns">
        <button class="mg-btn" id="syncCopy">📋 Копировать код</button>
        <button class="mg-btn ghost" id="syncImportBtn">📥 Вставить код</button>
      </div>
    </div>
    <button class="btn btn-ghost" id="resetBtn">Сбросить весь прогресс</button>
    <p class="screen-lead small">Данные хранятся в этом браузере. Используй синхронизацию чтобы делиться прогрессом.</p>
  </div>`);
  ov.replaceChildren(scr);
  $('#ovBack').onclick = closeOverlay;
  $('#tSound').onclick = () => { g.settings.sound = !g.settings.sound; store.save(); $('#tSound').classList.toggle('on'); };
  scr.querySelectorAll('.seg-btn[data-lang]').forEach(b => b.onclick = () => {
    g.lang = b.dataset.lang; store.save();
    scr.querySelectorAll('.seg-btn[data-lang]').forEach(x => x.classList.toggle('on', x === b));
    toast(`Язык: ${LANG_OPTIONS.find(l => l.code === b.dataset.lang)?.name}`);
  });
  scr.querySelectorAll('.seg-btn[data-voice]').forEach(b => b.onclick = () => {
    g.settings.voice = b.dataset.voice; store.save();
    scr.querySelectorAll('.seg-btn[data-voice]').forEach(x => x.classList.toggle('on', x === b));
    import('./audio.js').then(a => a.previewVoice());
  });
  scr.querySelectorAll('.seg-btn[data-gender]').forEach(b => b.onclick = () => {
    const gd = b.dataset.gender;
    store.setAvatarPart('gender', gd);
    if (gd === 'm') { store.setAvatarPart('shirt', '#3a6ea5'); store.setAvatarPart('hairStyle', 'short'); store.addOwned('shirt_blue'); store.addOwned('style_short'); }
    else { store.setAvatarPart('shirt', '#e07aa8'); store.setAvatarPart('hairStyle', 'curly'); }
    scr.querySelectorAll('.seg-btn[data-gender]').forEach(x => x.classList.toggle('on', x === b));
    if (world) world.setLook(store.getGame().avatar);
  });
  $('#npd').oninput = (e) => { g.newPerDay = Number(e.target.value); $('#npdVal').textContent = g.newPerDay; store.save(); };
  $('#syncCopy').onclick = () => { navigator.clipboard.writeText($('#syncCode').value).then(() => toast('Код скопирован!')).catch(() => { $('#syncCode').select(); document.execCommand('copy'); toast('Код скопирован!'); }); };
  $('#syncImportBtn').onclick = () => {
    const code = prompt('Вставь код синхронизации:');
    if (!code) return;
    if (store.syncImport(code)) { toast('✅ Прогресс загружен!'); hud(); screenSettings(ov); }
    else toast('❌ Неверный код');
  };
  $('#resetBtn').onclick = () => { if (confirm('Сбросить весь прогресс?')) { store.reset(); hud(); closeOverlay(); toast('Прогресс сброшен'); } };
}

// ---------- выбор языка (при первом запуске) ----------
function showLangPicker() {
  world && world.pause();
  const ov = el(`<div class="mg-overlay"><div class="mg-card"><div class="lp">
    <h2>Что изучаем?</h2>
    <p class="screen-lead">Выбери язык для изучения. Сменить можно в настройках.</p>
    <div class="lp-list">
      ${LANG_OPTIONS.map(l => `<button class="lp-opt" data-lang="${l.code}">
        <span class="lp-flag">${l.flag}</span>
        <span class="lp-name">${l.name}</span>
        <span class="lp-sub">${l.sub}</span>
      </button>`).join('')}
    </div></div></div></div>`);
  document.body.appendChild(ov);
  ov.querySelectorAll('.lp-opt').forEach(b => b.onclick = () => {
    store.getGame().lang = b.dataset.lang;
    store.save();
    ov.remove();
    if (!store.getGame().pickedGender) showGenderPicker();
    else { world && world.resume(); }
  });
}

// ---------- выбор персонажа (мальчик/девочка) ----------
function showGenderPicker() {
  world && world.pause();
  const av = store.getGame().avatar;
  const ov = el(`<div class="mg-overlay"><div class="mg-card"><div class="gp">
    <h2>Кто ты?</h2>
    <p class="screen-lead">Выбери персонажа — потом наряжаешь в магазине. Сменить можно в настройках.</p>
    <div class="gp-row">
      <button class="gp-opt" data-g="f"><div class="gp-av">${avatarSVG({ ...av, gender: 'f', shirt: '#e07aa8' })}</div><span>👧 Девочка</span></button>
      <button class="gp-opt" data-g="m"><div class="gp-av">${avatarSVG({ ...av, gender: 'm', shirt: '#3a6ea5', hairStyle: 'short' })}</div><span>👦 Мальчик</span></button>
    </div></div></div></div>`);
  document.body.appendChild(ov);
  ov.querySelectorAll('.gp-opt').forEach(b => b.onclick = () => {
    const g = b.dataset.g;
    store.setAvatarPart('gender', g);
    if (g === 'm') { store.setAvatarPart('shirt', '#3a6ea5'); store.setAvatarPart('hairStyle', 'short'); store.addOwned('shirt_blue'); store.addOwned('style_short'); }
    store.getGame().pickedGender = true; store.save();
    world && world.setLook(store.getGame().avatar); hud();
    ov.remove();
    runTutorial();
  });
}

// ---------- Обучение ----------
const TUTORIAL_STEPS = [
  {
    emoji: '👋',
    text: 'Привет! Я — милашка Айя, и помогу тебе выучить язык играючи. Начнём с небольшой экскурсии по моему студенческому городку!',
  },
  {
    emoji: '🏛️',
    text: 'Подходи к зданиям и нажимай «Взаимодействовать» — внутри тебя ждут задания и новые слова.',
    highlight: 'buildings',
  },
  {
    emoji: '💬',
    text: 'Горожане охотно поболтают! Подойди к персонажу и нажми кнопку внизу.',
    highlight: 'npc',
  },
  {
    emoji: '🎁',
    text: 'Ищи сундуки и особые объекты по всему городу — они скрывают приятные сюрпризы.',
    highlight: 'chest',
  },
  {
    emoji: '🛍️',
    text: 'Зарабатывай монеты 🪙 за ответы и трать их в магазине на новые образы.',
    highlight: 'shop',
  },
  {
    emoji: '🎯',
    text: 'Твоя цель — играючи выучить язык. Исследуй город, общайся с жителями и не забывай заходить каждый день. Удачи! 🌟',
  },
];

function runTutorial() {
  world && world.pause();
  return new Promise(resolve => {
    let step = 0;

    const ayaSVG = `<svg viewBox="0 0 80 90" width="80" height="90" xmlns="http://www.w3.org/2000/svg">
      <!-- тело -->
      <rect x="24" y="58" width="32" height="28" rx="6" fill="#ff80b3"/>
      <!-- шея -->
      <ellipse cx="40" cy="58" rx="7" ry="5" fill="#f5c6d8"/>
      <!-- голова -->
      <ellipse cx="40" cy="40" rx="20" ry="21" fill="#f5c6d8"/>
      <!-- волосы задние -->
      <ellipse cx="40" cy="32" rx="21" ry="16" fill="#7a4520"/>
      <rect x="19" y="30" width="8" height="18" rx="4" fill="#7a4520"/>
      <rect x="53" y="30" width="8" height="18" rx="4" fill="#7a4520"/>
      <!-- лицо поверх волос -->
      <ellipse cx="40" cy="42" rx="17" ry="18" fill="#f5c6d8"/>
      <!-- волосы верх (чёлка) -->
      <ellipse cx="40" cy="24" rx="21" ry="10" fill="#7a4520"/>
      <!-- брови -->
      <path d="M29 35 Q33 33 36 35" stroke="#5a3010" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M44 35 Q47 33 51 35" stroke="#5a3010" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- глаза -->
      <ellipse cx="33" cy="41" rx="5" ry="5.5" fill="white"/>
      <ellipse cx="47" cy="41" rx="5" ry="5.5" fill="white"/>
      <circle cx="33" cy="42" r="3" fill="#3a2a22"/>
      <circle cx="47" cy="42" r="3" fill="#3a2a22"/>
      <circle cx="34.2" cy="40.5" r="1.2" fill="white"/>
      <circle cx="48.2" cy="40.5" r="1.2" fill="white"/>
      <!-- ресницы -->
      <line x1="29" y1="36.5" x2="27.5" y2="34.5" stroke="#5a3010" stroke-width="1" stroke-linecap="round"/>
      <line x1="33" y1="35.5" x2="33" y2="33" stroke="#5a3010" stroke-width="1" stroke-linecap="round"/>
      <line x1="37" y1="36.5" x2="38.5" y2="34.5" stroke="#5a3010" stroke-width="1" stroke-linecap="round"/>
      <line x1="43" y1="36.5" x2="41.5" y2="34.5" stroke="#5a3010" stroke-width="1" stroke-linecap="round"/>
      <line x1="47" y1="35.5" x2="47" y2="33" stroke="#5a3010" stroke-width="1" stroke-linecap="round"/>
      <line x1="51" y1="36.5" x2="52.5" y2="34.5" stroke="#5a3010" stroke-width="1" stroke-linecap="round"/>
      <!-- нос -->
      <circle cx="38" cy="49" r="1.5" fill="#e8a8b8"/>
      <circle cx="42" cy="49" r="1.5" fill="#e8a8b8"/>
      <!-- губы -->
      <ellipse cx="40" cy="53.5" rx="5.5" ry="2.2" fill="#e88fa0"/>
      <path d="M34.5 53.5 Q40 57 45.5 53.5" stroke="#c0607a" stroke-width="1" fill="none" stroke-linecap="round"/>
      <!-- румянец -->
      <ellipse cx="27" cy="47" rx="4" ry="2.5" fill="rgba(255,150,150,0.3)"/>
      <ellipse cx="53" cy="47" rx="4" ry="2.5" fill="rgba(255,150,150,0.3)"/>
    </svg>`;

    const highlights = {
      buildings: '🏛️ Здания — подойди к двери',
      npc: '💬 Персонажи — подойди и поговори',
      chest: '🎁 Сундуки — ищи по всему городу',
      shop: '🛍️ Магазин — кнопка в правом верхнем углу',
    };

    const render = () => {
      const s = TUTORIAL_STEPS[step];
      const isLast = step === TUTORIAL_STEPS.length - 1;
      const dots = TUTORIAL_STEPS.map((_, i) =>
        `<span class="tut-dot ${i === step ? 'on' : ''}"></span>`).join('');

      ov.querySelector('.tut-inner').innerHTML = `
        <div class="tut-aya">${ayaSVG}</div>
        <div class="tut-name">Айя</div>
        <div class="tut-bubble">
          <div class="tut-emoji">${s.emoji}</div>
          <p class="tut-text">${s.text}</p>
          ${s.highlight ? `<div class="tut-hint">👆 ${highlights[s.highlight]}</div>` : ''}
        </div>
        <div class="tut-dots">${dots}</div>
        <div class="tut-btns">
          ${step > 0 ? '<button class="tut-back">‹ Назад</button>' : '<div></div>'}
          <button class="tut-next ${isLast ? 'last' : ''}">${isLast ? 'Поехали! 🚀' : 'Далее ›'}</button>
        </div>
        ${step === 0 ? '<button class="tut-skip">Пропустить</button>' : ''}
      `;

      ov.querySelector('.tut-next').onclick = () => {
        if (isLast) { finish(); } else { step++; render(); }
      };
      const back = ov.querySelector('.tut-back');
      if (back) back.onclick = () => { step--; render(); };
      const skip = ov.querySelector('.tut-skip');
      if (skip) skip.onclick = finish;
    };

    const finish = () => {
      ov.remove();
      world && world.resume();
      resolve();
    };

    const ov = el(`<div class="tut-overlay"><div class="tut-card"><div class="tut-inner"></div></div></div>`);
    document.body.appendChild(ov);
    render();
  });
}

// ---------- Ая (секретный NPC) ----------
async function talkAya() {
  world.pause(); $('#actionBtn').classList.add('hidden');
  try {
    const g = store.getGame();
    const dayKey = store.todayKey();
    if (g.ayaGiftDay === dayKey) {
      toast('🌸 Айя улыбается, но бонус уже дала сегодня!');
      return;
    }
    await new Promise((resolve) => {
      const ov = el(`<div class="mg-overlay"><div class="mg-card"><div class="mg-intro" style="text-align:center;padding:2rem 1.5rem">
        <div style="font-size:3.5rem;margin-bottom:.5rem">🌸</div>
        <h2 style="margin:.25rem 0;font-size:1.4rem">Айя</h2>
        <div style="font-size:1.1rem;margin:1rem 0;color:var(--c-text)">Бонус от милашки!</div>
        <div style="font-size:2.5rem;font-weight:700;color:#e6b800">🪙 +50</div>
        <button class="mg-btn" id="ayaOk" style="margin-top:1.5rem">Спасибо! 😊</button>
      </div></div></div>`);
      document.body.appendChild(ov);
      ov.querySelector('#ayaOk').onclick = () => { ov.remove(); resolve(); };
    });
    g.ayaGiftDay = dayKey;
    store.addRewards(50, 0);
    store.save(); hud();
    toast('🌸 +50 🪙 от Айи!');
  } finally { world.resume(); }
}

// ---------- памятники / декорации ----------
async function talkMonument(mon) {
  world.pause(); $('#actionBtn').classList.add('hidden');
  try {
    const cards = pickWords([mon.region], 8);
    if (!cards.length) { toast('...'); return; }
    const card = cards[(Math.random() * cards.length) | 0];
    const wrong = cards.filter(c => c !== card).slice(0, 2).map(c => c.ru);
    if (wrong.length < 2) { toast('Не хватает слов для задания'); return; }
    const opts = [...wrong, card.ru].sort(() => Math.random() - 0.5);
    const coins = await new Promise(resolve => {
      const ov = el(`<div class="mg-overlay"><div class="mg-card"><div class="mg-quiz" style="text-align:center;padding:1.5rem">
        <div style="font-size:1.8rem;margin-bottom:.5rem">${mon.label}</div>
        <div style="font-size:1.4rem;font-weight:700;margin:.75rem 0">${card.es}</div>
        <div style="font-size:2rem">${card.emoji}</div>
        <div class="mg-q" style="margin:.75rem 0">Что это значит?</div>
        <div class="mg-opts">${opts.map(o => `<button class="mg-opt" data-v="${encodeURIComponent(o)}">${o}</button>`).join('')}</div>
      </div></div></div>`);
      document.body.appendChild(ov);
      ov.querySelectorAll('.mg-opt').forEach(b => b.onclick = () => {
        const ok = decodeURIComponent(b.dataset.v) === card.ru;
        ov.querySelectorAll('.mg-opt').forEach(x => { x.disabled = true; if (decodeURIComponent(x.dataset.v) === card.ru) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        setTimeout(() => { ov.remove(); resolve(ok ? 2 : 1); }, ok ? 900 : 1100);
      });
    });
    store.addRewards(coins, 0); store.save(); hud();
    toast(`${coins === 2 ? '✓ ' : ''}+${coins} 🪙`);
  } finally { world.resume(); }
}

// ---------- казино ----------
async function enterCasino() {
  world.pause(); $('#actionBtn').classList.add('hidden');
  try {
    const COST = 5;
    const g = store.getGame();
    if (g.coins < COST) { toast(`Нужно хотя бы ${COST} 🪙`); return; }

    const SYMS = ['🍒','🍋','🍊','🍇','⭐'];
    function spin() { return SYMS[(Math.random() * SYMS.length) | 0]; }
    function outcome() {
      const r = Math.random() * 100;
      if (r < 1.5)  return { reels: ['⭐','⭐','⭐'], coins: 20, label: '🎉 ДЖЕКПОТ!' };
      if (r < 8.5)  { const s = SYMS[(Math.random()*4)|0]; return { reels: [s,s,s], coins: 15, label: '🏆 Три в ряд!' }; }
      if (r < 20.5) { const s = spin(); return { reels: ['⭐', s, '⭐'], coins: 10, label: '✨ Отлично!' }; }
      if (r < 45.5) { const s = spin(), b = spin(); return { reels: [s, s, b !== s ? b : SYMS[(SYMS.indexOf(b)+1)%5]], coins: 5, label: '👍 Неплохо!' }; }
      return { reels: [spin(), spin(), spin()], coins: 1 + (Math.random() < 0.5 ? 1 : 0), label: '🍀 Везунчик!' };
    }

    await new Promise(resolve => {
      const ov = el(`<div class="mg-overlay"><div class="mg-card cas-wrap">
        <div class="cas-title">🎰 Казино — ставка ${COST} 🪙</div>
        <div class="cas-reels">
          <div class="cas-reel" id="r0">🎰</div>
          <div class="cas-reel" id="r1">🎰</div>
          <div class="cas-reel" id="r2">🎰</div>
        </div>
        <div class="cas-result" id="casResult"></div>
        <div class="cas-btns">
          <button class="mg-btn" id="casPlay">Крутить 🎲 (−${COST} 🪙)</button>
          <button class="mg-btn cas-close" id="casClose">Выйти</button>
        </div>
      </div></div>`);
      document.body.appendChild(ov);

      let spinning = false;
      const play = async () => {
        if (spinning || store.getGame().coins < COST) { if (store.getGame().coins < COST) toast(`Нужно ${COST} 🪙`); return; }
        spinning = true;
        store.addRewards(-COST, 0); store.save(); hud();
        ov.querySelector('#casResult').textContent = '';

        const r0 = ov.querySelector('#r0'), r1 = ov.querySelector('#r1'), r2 = ov.querySelector('#r2');
        const res = outcome();
        // анимация
        let t = 0;
        const anim = setInterval(() => {
          t++;
          r0.textContent = spin();
          if (t > 6) r1.textContent = spin();
          if (t > 12) r2.textContent = spin();
          if (t > 18) {
            clearInterval(anim);
            r0.textContent = res.reels[0];
            r1.textContent = res.reels[1];
            r2.textContent = res.reels[2];
            store.addRewards(res.coins, 0); store.save(); hud();
            ov.querySelector('#casResult').textContent = `${res.label} +${res.coins} 🪙`;
            spinning = false;
          }
        }, 80);
      };

      ov.querySelector('#casPlay').onclick = play;
      ov.querySelector('#casClose').onclick = () => { ov.remove(); resolve(); };
    });
  } finally { world.resume(); }
}

// ---------- тост ----------
function toast(msg) {
  const t = el(`<div class="toast">${msg}</div>`); document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 1900);
}

// ---------- старт ----------
function init() {
  const used = store.checkStreakBreak(); store.save();
  hud();
  world = createWorld($('#game'), store.getGame().avatar, {
    onNearby: showAction, onEnter: enterLocation, onTalk: talkNPC, onChest: openChest, isChestOpen, onAya: talkAya, onMonument: talkMonument,
  });
  world.attachJoystick($('#joystick'), $('#joynub'));
  $('#actionBtn').onclick = () => world.interact();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.__dev = { enterLocation, talkNPC, openChest, LOCATIONS, world };
  }
  if (!store.getGame().lang) showLangPicker();
  else if (!store.getGame().pickedGender) showGenderPicker();
  else runTutorial();
  if (used > 0) setTimeout(() => toast(`🧊 Заморозка спасла серию (×${used})`), 700);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', init);
