// ============================================================
//  Карта: локации, прохожие, сундуки, диалоги, подбор слов (SRS)
// ============================================================
import { CARDS as CARDS_ES } from './cards.js';
import { CARDS as CARDS_EN } from './cards-en.js';
import { CARDS as CARDS_DE } from './cards-de.js';
import * as store from './store.js';
import * as srs from './srs.js';

export function getCards() {
  const lang = store.getGame().lang || 'es';
  if (lang === 'en') return CARDS_EN;
  if (lang === 'de') return CARDS_DE;
  return CARDS_ES;
}

export const MAP_W = 44, MAP_H = 32;
export const PLAZA = { x: 22, y: 15 };

// все игровые форматы — локации крутят их по очереди для разнообразия
export const FORMATS = ['match', 'complete', 'memory', 'translate', 'picture', 'scramble', 'listen', 'phrase', 'type', 'speak'];

// Здания. tx,ty — левый-верхний угол (тайлы), w,h — размер. themes — регионы слов.
export const LOCATIONS = [
  { id: 'salon',    name: 'Салон красоты',  es: 'Salón de Belleza', emoji: '💄', color: '#e07aa8', tx: 3,  ty: 3,  w: 5, h: 4, themes: [12] },
  { id: 'cafe',     name: 'Кафе',           es: 'Café',             emoji: '☕', color: '#e76f51', tx: 13, ty: 3,  w: 5, h: 4, themes: [5] },
  { id: 'teatro',   name: 'Театр',          es: 'Teatro',           emoji: '🎭', color: '#9a5ea7', tx: 23, ty: 3,  w: 5, h: 4, themes: [3] },
  { id: 'love',     name: 'Дом любви',      es: 'Casa del Amor',    emoji: '💗', color: '#e23a6e', tx: 33, ty: 3,  w: 5, h: 4, themes: [13] },
  { id: 'home',     name: 'Дом и быт',      es: 'La Casa',          emoji: '🏠', color: '#9a8c98', tx: 3,  ty: 11, w: 5, h: 4, themes: [8] },
  { id: 'bank',     name: 'Банк',           es: 'Banco',            emoji: '🏦', color: '#5b8e7d', tx: 37, ty: 11, w: 5, h: 4, themes: [2, 7] },
  { id: 'gym',      name: 'Спортзал',       es: 'Gimnasio',         emoji: '🏋️', color: '#4d908e', tx: 3,  ty: 19, w: 5, h: 4, themes: [9] },
  { id: 'mercado',  name: 'Рынок',          es: 'Mercado',          emoji: '🥕', color: '#43aa8b', tx: 37, ty: 19, w: 5, h: 4, themes: [5] },
  { id: 'school',   name: 'Школа',          es: 'Escuela',          emoji: '🏫', color: '#577590', tx: 12, ty: 25, w: 6, h: 4, themes: [3, 2] },
  { id: 'park',     name: 'Парк',           es: 'Parque',           emoji: '🌳', color: '#43aa8b', tx: 22, ty: 26, w: 5, h: 4, themes: [10] },
  { id: 'market',   name: 'Магазин одежды', es: 'Tienda',           emoji: '🛍️', color: '#f9c74f', tx: 33, ty: 25, w: 5, h: 4, themes: [7] },
  { id: 'hospital', name: 'Больница',       es: 'Hospital',         emoji: '🏥', color: '#e07a5f', tx: 2,  ty: 26, w: 5, h: 4, themes: [9] },
].map(l => ({ ...l, games: FORMATS }));

// прохожие — разбросаны по всей карте
export const NPC_SPOTS = [
  [10, 8], [19, 9], [30, 8], [8, 15], [34, 15], [22, 12],
  [12, 21], [28, 21], [18, 23], [30, 24], [6, 23], [24, 17],
  [40, 9], [16, 16], [27, 14],
];

// сундуки — открываешь → случайная мини-игра + бонус-монеты
export const CHEST_SPOTS = [
  { id: 'c1', x: 17, y: 13 }, { id: 'c2', x: 27, y: 18 }, { id: 'c3', x: 9, y: 12 },
  { id: 'c4', x: 35, y: 17 }, { id: 'c5', x: 20, y: 22 }, { id: 'c6', x: 31, y: 11 },
  { id: 'c7', x: 14, y: 18 }, { id: 'c8', x: 38, y: 24 },
];

// дорожки (визуал)
export const PATHS = [
  { x: 1, y: 14, w: 42, h: 2 }, { x: 1, y: 8, w: 42, h: 1 }, { x: 1, y: 23, w: 42, h: 1 },
  { x: 21, y: 1, w: 2, h: 30 }, { x: 10, y: 1, w: 1, h: 30 }, { x: 34, y: 1, w: 1, h: 30 },
];

// хот-спот входа: точка снаружи здания со стороны, обращённой к площади
export function doorTile(loc) {
  const cx = loc.tx + loc.w / 2, cy = loc.ty + loc.h / 2;
  const dx = PLAZA.x - cx, dy = PLAZA.y - cy;
  if (Math.abs(dx) >= Math.abs(dy)) return { x: dx > 0 ? loc.tx + loc.w + 0.7 : loc.tx - 0.7, y: cy };
  return { x: cx, y: dy > 0 ? loc.ty + loc.h + 0.7 : loc.ty - 0.7 };
}

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- шаблоны диалогов ----------
const RESPONDS_ES = [
  { npcEs: '¡Hola! ¿Cómo estás?', npcRu: 'Привет! Как дела?', answer: 'Bien, gracias. ¿Y tú?', options: ['Bien, gracias. ¿Y tú?', 'Me llamo Ana.', 'Son las tres.'] },
  { npcEs: '¿Cómo te llamas?', npcRu: 'Как тебя зовут?', answer: 'Me llamo Pablo.', options: ['Me llamo Pablo.', 'Muy bien.', 'De nada.'] },
  { npcEs: '¿De dónde eres?', npcRu: 'Откуда ты?', answer: 'Soy de Rusia.', options: ['Soy de Rusia.', 'Tengo hambre.', 'Hasta luego.'] },
  { npcEs: 'Muchas gracias.', npcRu: 'Большое спасибо.', answer: 'De nada.', options: ['De nada.', 'Buenos días.', 'No entiendo.'] },
  { npcEs: '¡Buen provecho!', npcRu: 'Приятного аппетита!', answer: 'Gracias, igualmente.', options: ['Gracias, igualmente.', '¿Cuánto cuesta?', 'Estoy perdido.'] },
  { npcEs: '¿Qué hora es?', npcRu: 'Который час?', answer: 'Son las dos.', options: ['Son las dos.', 'Soy médico.', 'Hace frío.'] },
];
const FILLS_ES = [
  { npcEs: '¿Qué comiste hoy?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'Comí ___.', youRu: 'Я ел(а) ___.', pool: 5 },
  { npcEs: '¿Qué quieres beber?', npcRu: 'Что хочешь выпить?', youEs: 'Quiero ___.', youRu: 'Я хочу ___.', pool: 5 },
  { npcEs: '¿De qué color es tu ropa?', npcRu: 'Какого цвета твоя одежда?', youEs: 'Es ___.', youRu: 'Она ___.', pool: 7 },
  { npcEs: '¿Cómo te sientes?', npcRu: 'Как ты себя чувствуешь?', youEs: 'Me siento ___.', youRu: 'Я чувствую себя ___.', pool: 9 },
  { npcEs: '¿Adónde vas?', npcRu: 'Куда ты идёшь?', youEs: 'Voy al ___.', youRu: 'Я иду в ___.', pool: 6 },
  { npcEs: '¿Qué tiempo hace?', npcRu: 'Какая погода?', youEs: 'Hoy ___.', youRu: 'Сегодня ___.', pool: 10 },
  { npcEs: 'Dime un piropo 😊', npcRu: 'Скажи мне комплимент 😊', youEs: '¡Eres ___!', youRu: 'Ты ___!', pool: 13 },
];

const RESPONDS_EN = [
  { npcEs: 'Hello! How are you?', npcRu: 'Привет! Как дела?', answer: 'Fine, thanks! And you?', options: ['Fine, thanks! And you?', 'My name is Anna.', "It's three o'clock."] },
  { npcEs: "What's your name?", npcRu: 'Как тебя зовут?', answer: 'My name is Alex.', options: ['My name is Alex.', 'Very good.', "You're welcome."] },
  { npcEs: 'Where are you from?', npcRu: 'Откуда ты?', answer: "I'm from Russia.", options: ["I'm from Russia.", "I'm hungry.", 'See you later.'] },
  { npcEs: 'Thank you so much!', npcRu: 'Большое спасибо!', answer: "You're welcome!", options: ["You're welcome!", 'Good morning.', "I don't understand."] },
  { npcEs: 'Enjoy your meal!', npcRu: 'Приятного аппетита!', answer: 'Thank you, likewise!', options: ['Thank you, likewise!', 'How much is it?', "I'm lost."] },
  { npcEs: 'What time is it?', npcRu: 'Который час?', answer: "It's two o'clock.", options: ["It's two o'clock.", "I'm a doctor.", "It's cold."] },
];
const FILLS_EN = [
  { npcEs: 'What did you eat today?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'I ate ___.', youRu: 'Я ел(а) ___.', pool: 5 },
  { npcEs: 'What do you want to drink?', npcRu: 'Что хочешь выпить?', youEs: 'I want ___.', youRu: 'Я хочу ___.', pool: 5 },
  { npcEs: 'What colour is your clothes?', npcRu: 'Какого цвета твоя одежда?', youEs: "It's ___.", youRu: 'Она ___.', pool: 7 },
  { npcEs: 'How do you feel?', npcRu: 'Как ты себя чувствуешь?', youEs: 'I feel ___.', youRu: 'Я чувствую себя ___.', pool: 9 },
  { npcEs: 'Where are you going?', npcRu: 'Куда ты идёшь?', youEs: "I'm going to the ___.", youRu: 'Я иду в ___.', pool: 6 },
  { npcEs: "What's the weather like?", npcRu: 'Какая погода?', youEs: 'Today it is ___.', youRu: 'Сегодня ___.', pool: 10 },
  { npcEs: 'Say something nice 😊', npcRu: 'Скажи что-нибудь приятное 😊', youEs: 'You are ___!', youRu: 'Ты ___!', pool: 13 },
];

const RESPONDS_DE = [
  { npcEs: 'Hallo! Wie geht es dir?', npcRu: 'Привет! Как дела?', answer: 'Gut, danke! Und dir?', options: ['Gut, danke! Und dir?', 'Ich heiße Anna.', 'Es ist drei Uhr.'] },
  { npcEs: 'Wie heißt du?', npcRu: 'Как тебя зовут?', answer: 'Ich heiße Max.', options: ['Ich heiße Max.', 'Sehr gut.', 'Bitte.'] },
  { npcEs: 'Woher kommst du?', npcRu: 'Откуда ты?', answer: 'Ich komme aus Russland.', options: ['Ich komme aus Russland.', 'Ich habe Hunger.', 'Tschüss.'] },
  { npcEs: 'Vielen Dank!', npcRu: 'Большое спасибо!', answer: 'Bitte sehr!', options: ['Bitte sehr!', 'Guten Morgen.', 'Ich verstehe nicht.'] },
  { npcEs: 'Guten Appetit!', npcRu: 'Приятного аппетита!', answer: 'Danke, gleichfalls!', options: ['Danke, gleichfalls!', 'Wie viel kostet das?', 'Ich bin verloren.'] },
  { npcEs: 'Wie spät ist es?', npcRu: 'Который час?', answer: 'Es ist zwei Uhr.', options: ['Es ist zwei Uhr.', 'Ich bin Arzt.', 'Es ist kalt.'] },
];
const FILLS_DE = [
  { npcEs: 'Was hast du heute gegessen?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'Ich habe ___ gegessen.', youRu: 'Я ел(а) ___.', pool: 5 },
  { npcEs: 'Was möchtest du trinken?', npcRu: 'Что хочешь выпить?', youEs: 'Ich möchte ___.', youRu: 'Я хочу ___.', pool: 5 },
  { npcEs: 'Welche Farbe hat deine Kleidung?', npcRu: 'Какого цвета твоя одежда?', youEs: 'Sie ist ___.', youRu: 'Она ___.', pool: 7 },
  { npcEs: 'Wie fühlst du dich?', npcRu: 'Как ты себя чувствуешь?', youEs: 'Ich fühle mich ___.', youRu: 'Я чувствую себя ___.', pool: 9 },
  { npcEs: 'Wohin gehst du?', npcRu: 'Куда ты идёшь?', youEs: 'Ich gehe zum ___.', youRu: 'Я иду в ___.', pool: 6 },
  { npcEs: 'Wie ist das Wetter?', npcRu: 'Какая погода?', youEs: 'Heute ist es ___.', youRu: 'Сегодня ___.', pool: 10 },
  { npcEs: 'Sag etwas Nettes 😊', npcRu: 'Скажи что-нибудь приятное 😊', youEs: 'Du bist ___!', youRu: 'Ты ___!', pool: 13 },
];

// убрать артикль по языку
export function bare(word, lang) {
  const l = lang || store.getGame().lang || 'es';
  if (l === 'de') return word.replace(/^(der |die |das |ein |eine )/i, '');
  if (l === 'es') return word.replace(/^(el |la |los |las |un |una )/, '');
  return word;
}

// собрать случайный диалог
export function makeDialogue() {
  const lang = store.getGame().lang || 'es';
  const responds = lang === 'en' ? RESPONDS_EN : lang === 'de' ? RESPONDS_DE : RESPONDS_ES;
  const fills = lang === 'en' ? FILLS_EN : lang === 'de' ? FILLS_DE : FILLS_ES;
  const CARDS = getCards();

  if (Math.random() < 0.45) {
    const r = responds[(Math.random() * responds.length) | 0];
    return { kind: 'respond', npcEs: r.npcEs, npcRu: r.npcRu, answer: r.answer, options: shuffle(r.options) };
  }
  const t = fills[(Math.random() * fills.length) | 0];
  const pool = CARDS.filter(c => c.region === t.pool && c.es.split(' ').length <= 4);
  if (!pool.length) { const r = responds[0]; return { kind: 'respond', npcEs: r.npcEs, npcRu: r.npcRu, answer: r.answer, options: shuffle(r.options) }; }
  const target = pool[(Math.random() * pool.length) | 0];
  const distr = shuffle(pool.filter(c => c !== target)).slice(0, 2).map(c => bare(c.es));
  const options = shuffle([bare(target.es), ...distr]);
  return { kind: 'fill', npcEs: t.npcEs, npcRu: t.npcRu, youEs: t.youEs, youRu: t.youRu, answer: bare(target.es), options, card: target };
}

// ---------- подбор слов по теме через SRS ----------
export function pickWords(themes, n) {
  const now = Date.now();
  const CARDS = getCards();
  const pool = CARDS.filter(c => themes.includes(c.region));
  const due = [], fresh = [], rest = [];
  for (const c of pool) {
    const st = store.getCardState(c.id);
    if (!st.seen) fresh.push(c);
    else if (st.due <= now) due.push(c);
    else rest.push(c);
  }
  const pick = [];
  const take = (arr) => { for (const c of shuffle(arr)) { if (pick.length >= n) break; if (!pick.includes(c)) pick.push(c); } };
  take(due);
  const g = store.getGame();
  let newBudget = Math.max(0, store.effectiveNewPerDay() - g.todayNew);
  for (const c of shuffle(fresh)) { if (pick.length >= n || newBudget <= 0) break; pick.push(c); newBudget--; }
  take(rest);
  if (pick.length === 0) take(fresh.length ? fresh : pool);
  else if (pick.length < Math.min(n, pool.length)) take(rest.concat(fresh));
  return shuffle(pick).slice(0, Math.min(n, pick.length));
}

export function isNew(card) { return !store.getCardState(card.id).seen; }
