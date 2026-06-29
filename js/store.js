// ============================================================
//  Хранилище прогресса и игрового состояния (localStorage)
// ============================================================

import { newState } from './srs.js';
import { DEFAULT_LOOK } from './avatar.js';

const KEY = 'pueblo.save.v1';

const defaultGame = () => ({
  coins: 0,
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  lastStudyDay: null,     // 'YYYY-MM-DD'
  daysStudied: 0,
  newPerDay: 10,          // базовый лимит новых слов в день
  lang: null,             // 'es' | 'en' | 'de' — выбранный язык для изучения
  settings: {
    sound: true,          // озвучка
    autoSpeak: true,      // автоозвучка при показе исп. слова
    voice: 'female',      // предпочтение голоса носителя: female | male
  },
  // статистика по дню для дневного лимита новых
  todayNew: 0,
  todayDay: null,
  pickedGender: false,       // выбрал ли игрок мальчик/девочка
  openedChests: {},          // сундуки, открытые в этот день: { id: 'YYYY-MM-DD' }
  // ----- магазин / персонаж -----
  avatar: { ...DEFAULT_LOOK },
  townSkin: 'dia',
  owned: ['hat_none', 'hair_brown', 'style_curly', 'shirt_pink', 'acc_none', 'town_dia'],
  boosts: {
    extraNewPerDay: 0,   // +N к лимиту новых слов
    freezes: 0,          // заморозки серии
    hint: false,         // разблокированы подсказки в наборе
    doubleLeft: 0,       // сколько карточек ещё дают ×2 монеты
  },
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { game: defaultGame(), progress: {} };
    const parsed = JSON.parse(raw);
    const d = defaultGame();
    const g = parsed.game || {};
    // глубокое слияние вложенных объектов, чтобы старые сейвы получили новые поля
    const merged = {
      ...d, ...g,
      settings: { ...d.settings, ...(g.settings || {}) },
      avatar: { ...d.avatar, ...(g.avatar || {}) },
      boosts: { ...d.boosts, ...(g.boosts || {}) },
      owned: Array.isArray(g.owned) ? [...new Set([...d.owned, ...g.owned])] : d.owned,
      lang: g.lang ?? d.lang,
    };
    return { game: merged, progress: parsed.progress || {} };
  } catch (e) {
    console.warn('save corrupt, resetting', e);
    return { game: defaultGame(), progress: {} };
  }
}

export function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getGame() { return state.game; }

export function getCardState(id) {
  return state.progress[id] || newState();
}

export function setCardState(id, st) {
  state.progress[id] = st;
}

export function allProgress() { return state.progress; }

export function reset() {
  state = { game: defaultGame(), progress: {} };
  save();
}

// ---- магазин / персонаж ----
export function effectiveNewPerDay() {
  const g = state.game;
  return g.newPerDay + (g.boosts.extraNewPerDay || 0);
}
export function owns(id) { return state.game.owned.includes(id); }
export function addOwned(id) { if (!owns(id)) state.game.owned.push(id); }
export function spend(n) {
  if (state.game.coins < n) return false;
  state.game.coins -= n;
  return true;
}
export function setAvatarPart(slot, val) { state.game.avatar[slot] = val; save(); }
export function setTownSkin(val) { state.game.townSkin = val; save(); }

// ---- синхронизация прогресса (base64-код для передачи между устройствами) ----
export function syncExport() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}
export function syncImport(code) {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!parsed.game || !parsed.progress) throw new Error('invalid');
    state = parsed;
    save();
    return true;
  } catch (e) {
    return false;
  }
}

// ---- дата как 'YYYY-MM-DD' в локальном времени ----
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Сбросить дневной счётчик новых слов, если наступил новый день
export function rolloverDay() {
  const g = state.game;
  const tk = todayKey();
  if (g.todayDay !== tk) {
    g.todayDay = tk;
    g.todayNew = 0;
  }
  return g;
}

// Отметить, что сегодня была учёба — обновить серию (racha)
export function markStudied() {
  const g = state.game;
  const tk = todayKey();
  if (g.lastStudyDay === tk) return g; // уже отметили сегодня

  const yesterday = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (g.lastStudyDay === yesterday) g.streak += 1;
  else g.streak = 1;

  g.bestStreak = Math.max(g.bestStreak, g.streak);
  g.lastStudyDay = tk;
  g.daysStudied += 1;
  save();
  return g;
}

// Если пропустили дни — попытаться спасти серию заморозками, иначе обнулить.
// Возвращает число использованных заморозок (для уведомления).
export function checkStreakBreak() {
  const g = state.game;
  if (!g.lastStudyDay) return 0;
  const DAYMS = 24 * 60 * 60 * 1000;
  const tk = todayKey();
  const yesterday = todayKey(new Date(Date.now() - DAYMS));
  if (g.lastStudyDay === tk || g.lastStudyDay === yesterday) return 0;

  // сколько полных дней пропущено (gap=1 значит вчера не учились)
  const last = new Date(g.lastStudyDay + 'T00:00:00');
  const today = new Date(tk + 'T00:00:00');
  const gap = Math.round((today - last) / DAYMS) - 1; // пропущенных дней
  let used = 0;
  while (used < gap && g.boosts.freezes > 0) { g.boosts.freezes -= 1; used += 1; }
  if (used >= gap) {
    // все дыры закрыты заморозками — серия продолжается, как будто учились вчера
    g.lastStudyDay = yesterday;
  } else {
    g.streak = 0;
  }
  save();
  return used;
}

// уровень = функция от опыта
export function addRewards(coins, xp) {
  const g = state.game;
  g.coins += coins;
  g.xp += xp;
  g.level = levelFromXp(g.xp);
}

export function levelFromXp(xp) {
  // 100 опыта на 1-й уровень, дальше растёт
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl += 1; need = Math.round(need * 1.25); }
  return lvl;
}

export function xpProgress(xp) {
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl += 1; need = Math.round(need * 1.25); }
  return { lvl, into: xp - acc, need, pct: Math.round(((xp - acc) / need) * 100) };
}
