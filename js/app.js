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
    if (res.coins) toast(`${res.correct ? '✓ ¡Bien!' : 'Почти!'} +${res.coins} 🪙`);
  } finally { world.resume(); }
}

const todayKey = () => store.todayKey();
function isChestOpen(id) { return store.getGame().openedChests[id] === todayKey(); }

async function openChest(chest) {
  world.pause(); $('#actionBtn').classList.add('hidden');
  try {
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
    import('./audio.js').then(a => a.speak(voiceTestPhrases[g.lang || 'es'] || voiceTestPhrases.es));
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
    ov.remove(); world && world.resume();
  });
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
    onNearby: showAction, onEnter: enterLocation, onTalk: talkNPC, onChest: openChest, isChestOpen,
  });
  world.attachJoystick($('#joystick'), $('#joynub'));
  $('#actionBtn').onclick = () => world.interact();
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.__dev = { enterLocation, talkNPC, openChest, LOCATIONS, world };
  }
  if (!store.getGame().lang) showLangPicker();
  else if (!store.getGame().pickedGender) showGenderPicker();
  if (used > 0) setTimeout(() => toast(`🧊 Заморозка спасла серию (×${used})`), 700);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', init);
