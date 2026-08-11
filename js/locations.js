// ============================================================
//  Карта: локации, прохожие, сундуки, диалоги, подбор слов (SRS)
// ============================================================
import { CARDS as CARDS_ES } from './cards.js';
import { CARDS as CARDS_EN_BASE } from './cards-en.js';
import { CARDS_EXTRA as CARDS_EN_EXTRA } from './cards-en-extra.js';
import { CARDS as CARDS_DE } from './cards-de.js';
import { CARDS_DE_EXTRA_A } from './cards-de-extra-a.js';
import { CARDS_DE_EXTRA_B } from './cards-de-extra-b.js';
import { CARDS as CARDS_KO } from './cards-ko.js';
import { CARDS as CARDS_ZH } from './cards-zh.js';
import { BASICS } from './cards-basics.js';
import * as store from './store.js';
import * as srs from './srs.js';

const CARDS_EN = [...CARDS_EN_BASE, ...CARDS_EN_EXTRA];
const CARDS_DE_ALL = [...CARDS_DE, ...CARDS_DE_EXTRA_A, ...CARDS_DE_EXTRA_B];

// у китайских карточек пиньинь записан в конце ru-поля как «(nǐ hǎo)» —
// выносим его в поле tr, чтобы показывать рядом с иероглифом в заданиях
const withTr = (c) => {
  const m = c.ru.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { ...c, ru: m[1], tr: m[2] } : c;
};

// полные колоды: основная + «азы» (регион 14, здание Ясли)
const DECKS = {
  es: [...CARDS_ES, ...BASICS.es],
  en: [...CARDS_EN, ...BASICS.en],
  de: [...CARDS_DE_ALL, ...BASICS.de],
  ko: [...CARDS_KO, ...BASICS.ko],
  zh: [...CARDS_ZH.map(withTr), ...BASICS.zh],
};

// подпись слова для заданий: иероглифы/хангыль + транскрипция, если есть
export function wordLabel(c) { return c.tr ? `${c.es} (${c.tr})` : c.es; }

export function getCards() {
  const lang = store.getGame().lang || 'es';
  return DECKS[lang] || DECKS.es;
}

// форматы, доступные для текущего языка: для корейского и китайского исключаем
// «напиши слово» — набирать хангыль/иероглифы без нужной клавиатуры нельзя
export function activeFormats() {
  const lang = store.getGame().lang || 'es';
  return (lang === 'ko' || lang === 'zh') ? FORMATS.filter(f => f !== 'type') : FORMATS;
}

export const MAP_W = 44, MAP_H = 32;
export const PLAZA = { x: 22, y: 15 };

// все игровые форматы — локации крутят их по очереди для разнообразия
export const FORMATS = ['match', 'complete', 'memory', 'translate', 'picture', 'scramble', 'listen', 'phrase', 'type', 'speak'];

// Здания. tx,ty — левый-верхний угол (тайлы), w,h — размер. themes — регионы слов.
export const LOCATIONS = [
  // Ясли — самые азы для новичков с нуля (регион 14), только лёгкие форматы на узнавание
  { id: 'nursery',  name: 'Ясли',           es: 'Guardería',        emoji: '🍼', color: '#f2a0bd', tx: 26, ty: 11, w: 5, h: 4, themes: [14], easy: ['picture', 'match', 'listen', 'memory'] },
  { id: 'salon',    name: 'Салон красоты',  es: 'Salón de Belleza', emoji: '💄', color: '#e07aa8', tx: 3,  ty: 3,  w: 5, h: 4, themes: [12] },
  { id: 'cafe',     name: 'Кафе',           es: 'Café',             emoji: '☕', color: '#e76f51', tx: 13, ty: 3,  w: 5, h: 4, themes: [5] },
  { id: 'teatro',   name: 'Театр',          es: 'Teatro',           emoji: '🎭', color: '#9a5ea7', tx: 20, ty: 3,  w: 5, h: 4, themes: [1, 11] },
  { id: 'love',     name: 'Дом любви',      es: 'Casa del Amor',    emoji: '💗', color: '#e23a6e', tx: 35, ty: 3,  w: 5, h: 4, themes: [13] },
  { id: 'home',     name: 'Дом и быт',      es: 'La Casa',          emoji: '🏠', color: '#9a8c98', tx: 3,  ty: 11, w: 5, h: 4, themes: [8] },
  { id: 'bank',     name: 'Банк',           es: 'Banco',            emoji: '🏦', color: '#5b8e7d', tx: 37, ty: 11, w: 5, h: 4, themes: [2] },
  { id: 'gym',      name: 'Спортзал',       es: 'Gimnasio',         emoji: '🏋️', color: '#4d908e', tx: 3,  ty: 19, w: 5, h: 4, themes: [9] },
  { id: 'mercado',  name: 'Рынок',          es: 'Mercado',          emoji: '🥕', color: '#43aa8b', tx: 37, ty: 19, w: 5, h: 4, themes: [5] },
  { id: 'school',   name: 'Школа',          es: 'Escuela',          emoji: '🏫', color: '#577590', tx: 12, ty: 25, w: 6, h: 4, themes: [3, 2] },
  { id: 'park',     name: 'Парк',           es: 'Parque',           emoji: '🌳', color: '#43aa8b', tx: 22, ty: 26, w: 5, h: 4, themes: [10] },
  { id: 'market',   name: 'Магазин одежды', es: 'Tienda',           emoji: '🛍️', color: '#f9c74f', tx: 33, ty: 25, w: 5, h: 4, themes: [7] },
  { id: 'hospital', name: 'Больница',       es: 'Hospital',         emoji: '🏥', color: '#e07a5f', tx: 2,  ty: 26, w: 5, h: 4, themes: [9] },
  { id: 'casino', name: 'Казино',  emoji: '🎰', color: '#f4c430', tx: 28, ty: 3,  w: 3, h: 4, themes: [2] },
].map(l => ({ ...l, games: FORMATS }));

// прохожие — разбросаны по всей карте
export const NPC_SPOTS = [
  [10, 8], [19, 9], [32, 9], [9, 15], [34, 15], [22, 12],
  [14, 21], [28, 21], [18, 23], [32, 24], [6.5, 24], [24, 17],
  [40, 9], [16, 16], [27.5, 16],
];

// сундуки — открываешь → случайная мини-игра + бонус-монеты
// координаты сверены скриптом, чтобы ничего не залезало на здания/двери/друг на друга
export const CHEST_SPOTS = [
  { id: 'c1', x: 17, y: 13 }, { id: 'c2', x: 27, y: 18 }, { id: 'c3', x: 9, y: 12 },
  { id: 'c4', x: 35, y: 17 }, { id: 'c5', x: 20, y: 22 }, { id: 'c6', x: 32, y: 11 },
  { id: 'c7', x: 14, y: 18 }, { id: 'c8', x: 36, y: 24 },
  { id: 'dev', x: 3, y: 1.5, secret: true },
];

// фиксированные деревья (аккуратно расставлены по карте)
export const TREE_SPOTS = [
  [2,2],[11,2],[20,2],[29,2],[40,2],
  [2,10],[12,10],[20,10],[29,10],[40,10],
  [2,17],[42.5,17.5],
  [2,24],[12,24],[20,24],[29,24],[40,24],
  [1.5,30],[12,30],[20,30],[29,30],[40,30],
];

// кусты (заполняют пустые места)
export const BUSH_SPOTS = [
  [5,2],[15,2],[25,2],[35,2],
  [5,10],[25,10],[35,10],
  [5,24],[25,24],[35,24],
  [5.5,30.5],[25.5,30.5],[35,30],
];

// скамейки
export const BENCH_SPOTS = [
  {x:12,y:8},{x:35,y:8},
  {x:10,y:13},{x:36,y:14.5},
  {x:10,y:21},{x:36,y:22.5},
  {x:21,y:12},{x:25,y:12},
];

// фонари (на пересечениях дорожек)
export const LAMP_SPOTS = [
  [10,7],[21.5,7.5],[34,7],
  [10,16],[22,16],[34,16],
  [10,22],[22,22],[34,22],
];

// памятники и украшения (интерактивные)
export const MONUMENT_SPOTS = [
  { x:24, y:11, type:'statue',         label:'📜 Статуя',  region:1 },
  { x:16, y:13, type:'arch',           label:'🏛️ Арка',    region:6 },
  { x:29, y:16, type:'obelisk',        label:'🗿 Обелиск', region:2 },
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
  // Приветствия и базовые фразы
  { npcEs: '¡Hola! ¿Cómo estás?', npcRu: 'Привет! Как дела?', answer: 'Bien, gracias. ¿Y tú?', options: ['Bien, gracias. ¿Y tú?', 'Más o menos, ¿y tú?', 'Regular, gracias.'] },
  { npcEs: '¿Cómo te llamas?', npcRu: 'Как тебя зовут?', answer: 'Me llamo Pablo.', options: ['Me llamo Pablo.', 'Me llamo bien.', 'Llamo a Pablo.'] },
  { npcEs: '¿De dónde eres?', npcRu: 'Откуда ты?', answer: 'Soy de Rusia.', options: ['Soy de Rusia.', 'Estoy de Rusia.', 'Vengo de aquí.'] },
  { npcEs: 'Muchas gracias.', npcRu: 'Большое спасибо.', answer: 'De nada.', options: ['De nada.', 'Con mucho gusto.', 'Por favor.'] },
  { npcEs: '¡Buen provecho!', npcRu: 'Приятного аппетита!', answer: 'Gracias, igualmente.', options: ['Gracias, igualmente.', 'Gracias, también.', 'Igualmente, por favor.'] },
  { npcEs: '¿Qué hora es?', npcRu: 'Который час?', answer: 'Son las dos.', options: ['Son las dos.', 'Es las dos.', 'Hace las dos.'] },
  // Покупки
  { npcEs: '¿Cuánto cuesta esto?', npcRu: 'Сколько это стоит?', answer: 'Son diez euros.', options: ['Son diez euros.', 'Cuesta mucho dinero.', 'Vale diez euros.'] },
  { npcEs: '¿Tiene algo más barato?', npcRu: 'Есть что-нибудь подешевле?', answer: 'Sí, tenemos esta oferta.', options: ['Sí, tenemos esta oferta.', 'No, todo es caro.', 'Sí, es muy bonito.'] },
  // Погода
  { npcEs: '¡Hace mucho calor hoy!', npcRu: 'Сегодня очень жарко!', answer: '¡Sí, estoy sudando!', options: ['¡Sí, estoy sudando!', '¡Sí, tengo frío!', '¡Sí, llueve mucho!'] },
  { npcEs: '¿Crees que va a llover?', npcRu: 'Думаешь, будет дождь?', answer: 'Sí, las nubes están oscuras.', options: ['Sí, las nubes están oscuras.', 'Sí, hace mucho sol.', 'No, el cielo está nublado.'] },
  // Еда
  { npcEs: '¿Qué recomiendas?', npcRu: 'Что рекомендуешь?', answer: 'El pollo está muy rico.', options: ['El pollo está muy rico.', 'El pollo está muy frío.', 'La sopa está muy cara.'] },
  { npcEs: '¿Está bueno el café?', npcRu: 'Хороший кофе?', answer: 'Sí, está recién hecho.', options: ['Sí, está recién hecho.', 'Sí, está muy frío.', 'No, es muy dulce.'] },
  // Дорога
  { npcEs: 'Perdona, ¿dónde está el banco?', npcRu: 'Простите, где банк?', answer: 'Está a dos calles.', options: ['Está a dos calles.', 'Está muy lejos de aquí.', 'Está en el banco.'] },
  { npcEs: '¿Hay una farmacia cerca?', npcRu: 'Есть аптека рядом?', answer: 'Sí, gira a la derecha.', options: ['Sí, gira a la derecha.', 'Sí, está muy lejos.', 'No, está a la derecha.'] },
  // Транспорт
  { npcEs: '¿A qué hora sale el autobús?', npcRu: 'В котором часу отходит автобус?', answer: 'A las tres y media.', options: ['A las tres y media.', 'En las tres y media.', 'A tres y media.'] },
  // Знакомство
  { npcEs: '¿Cuántos años tienes?', npcRu: 'Сколько тебе лет?', answer: 'Tengo veinticinco años.', options: ['Tengo veinticinco años.', 'Soy veinticinco años.', 'Tengo veinticinco.'] },
  // Приглашение
  { npcEs: '¿Quieres tomar un café?', npcRu: 'Хочешь выпить кофе?', answer: '¡Con mucho gusto!', options: ['¡Con mucho gusto!', '¡Con mucho café!', '¡Sí, tengo sed!'] },
  // Прощание
  { npcEs: '¡Hasta pronto!', npcRu: 'До скорого!', answer: '¡Igualmente! ¡Cuídate!', options: ['¡Igualmente! ¡Cuídate!', '¡Igualmente! ¡Hasta mañana!', '¡Sí! ¡Cuídate!'] },
  // Комплимент
  { npcEs: '¡Qué bonito atuendo!', npcRu: 'Какой красивый наряд!', answer: '¡Muchas gracias!', options: ['¡Muchas gracias!', '¡Sí, es bonito!', '¡De nada!'] },
  // Здоровье
  { npcEs: '¿Cómo te encuentras?', npcRu: 'Как ты себя чувствуешь?', answer: 'Me duele un poco la cabeza.', options: ['Me duele un poco la cabeza.', 'Me encuentro en casa.', 'Me duele mucho el café.'] },
  // Хобби
  { npcEs: '¿Qué te gusta hacer?', npcRu: 'Что тебе нравится делать?', answer: 'Me encanta bailar y leer.', options: ['Me encanta bailar y leer.', 'Me gusta mucho la música.', 'Me encanta bailar y correr.'] },
  // Работа
  { npcEs: '¿A qué te dedicas?', npcRu: 'Чем ты занимаешься?', answer: 'Soy estudiante.', options: ['Soy estudiante.', 'Estoy estudiante.', 'Soy el estudiante.'] },
  // Семья
  { npcEs: '¿Tienes hermanos?', npcRu: 'Есть братья или сёстры?', answer: 'Sí, tengo un hermano mayor.', options: ['Sí, tengo un hermano mayor.', 'Sí, tengo un hermano pequeño.', 'Sí, tengo hermanos mayores.'] },
  // Планы
  { npcEs: '¿Qué vas a hacer esta tarde?', npcRu: 'Что будешь делать сегодня вечером?', answer: 'Voy a estudiar español.', options: ['Voy a estudiar español.', 'Voy a estudiar mañana.', 'Voy a hacer español.'] },
  // Комплимент за язык
  { npcEs: '¡Hablas muy bien español!', npcRu: 'Ты очень хорошо говоришь по-испански!', answer: 'Gracias, estoy aprendiendo.', options: ['Gracias, estoy aprendiendo.', 'Gracias, hablo muy bien.', 'Gracias, sigo practicando.'] },
];

// В каждом fill-шаблоне words — явный список подходящих по смыслу слов из колоды
// (совпадают с полем es карточки). Дистракторы берутся только из этого же списка.
const FILLS_ES = [
  { npcEs: '¿Qué comiste hoy?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'Comí ___.', youRu: 'Я ел(а) ___.', words: ['el pan', 'el queso', 'el pollo', 'el pescado', 'la carne', 'el huevo', 'la manzana', 'el plátano'] },
  { npcEs: '¿Qué quieres beber?', npcRu: 'Что хочешь выпить?', youEs: 'Quiero ___.', youRu: 'Я хочу ___.', words: ['el agua', 'el café', 'el té', 'la leche', 'el zumo'] },
  { npcEs: '¿Adónde vas?', npcRu: 'Куда ты идёшь?', youEs: 'Voy al ___.', youRu: 'Я иду в ___.', words: ['el parque', 'el banco', 'el hospital', 'el mercado', 'el museo', 'el cine', 'el supermercado'] },
  { npcEs: '¿Cómo prefieres viajar?', npcRu: 'Как тебе нравится путешествовать?', youEs: 'Prefiero ir en ___.', youRu: 'Я предпочитаю ехать на ___.', words: ['el coche', 'el autobús', 'el tren', 'el metro', 'el taxi', 'el avión', 'la bicicleta'] },
  { npcEs: '¿Qué tiempo hace?', npcRu: 'Какая погода?', youEs: 'Hoy ___.', youRu: 'Сегодня ___.', words: ['hace sol', 'hace calor', 'hace frío', 'hace viento', 'llueve', 'nieva'] },
  { npcEs: '¿Quién te espera en casa?', npcRu: 'Кто ждёт тебя дома?', youEs: 'Me espera mi ___.', youRu: 'Меня ждёт ___.', words: ['mamá', 'papá', 'el hermano', 'la hermana', 'el abuelo', 'la abuela'] },
  { npcEs: '¿Cuál es tu estación favorita?', npcRu: 'Какое твоё любимое время года?', youEs: 'Mi estación favorita es ___.', youRu: 'Моё любимое время года — ___.', words: ['la primavera', 'el verano', 'el otoño', 'el invierno'] },
];

const RESPONDS_EN = [
  // Приветствия
  { npcEs: 'Hello! How are you?', npcRu: 'Привет! Как дела?', answer: 'Fine, thanks! And you?', options: ['Fine, thanks! And you?', 'Not bad, and you?', 'Pretty good, thanks!'] },
  { npcEs: "What's your name?", npcRu: 'Как тебя зовут?', answer: 'My name is Alex.', options: ['My name is Alex.', "I'm called fine.", "I'm Alex's friend."] },
  { npcEs: 'Where are you from?', npcRu: 'Откуда ты?', answer: "I'm from Russia.", options: ["I'm from Russia.", "I come from here.", "I'm going to Russia."] },
  { npcEs: 'Thank you so much!', npcRu: 'Большое спасибо!', answer: "You're welcome!", options: ["You're welcome!", 'No problem at all.', 'That was nothing.'] },
  { npcEs: 'Enjoy your meal!', npcRu: 'Приятного аппетита!', answer: 'Thank you, likewise!', options: ['Thank you, likewise!', 'Thanks, same to you!', 'Thank you, enjoy!'] },
  { npcEs: 'What time is it?', npcRu: 'Который час?', answer: "It's two o'clock.", options: ["It's two o'clock.", "It's about two hours.", "Two o'clock is right."] },
  // Покупки
  { npcEs: 'How much does this cost?', npcRu: 'Сколько это стоит?', answer: "It's ten pounds.", options: ["It's ten pounds.", 'It costs a lot.', "That's ten items."] },
  { npcEs: 'Do you have anything cheaper?', npcRu: 'Есть что-нибудь дешевле?', answer: "Yes, we have this one on sale.", options: ["Yes, we have this one on sale.", 'No, everything is expensive.', 'Yes, it is very nice.'] },
  // Погода
  { npcEs: "It's so hot today!", npcRu: 'Сегодня так жарко!', answer: "Yes, I'm sweating!", options: ["Yes, I'm sweating!", "Yes, I'm freezing!", "Yes, it's raining a lot!"] },
  { npcEs: 'Do you think it will rain?', npcRu: 'Думаешь, будет дождь?', answer: 'Yes, the clouds look dark.', options: ['Yes, the clouds look dark.', 'Yes, the sun is bright.', 'No, the sky is cloudy.'] },
  // Еда
  { npcEs: 'What do you recommend?', npcRu: 'Что рекомендуешь?', answer: 'The chicken is delicious.', options: ['The chicken is delicious.', 'The chicken is very cold.', 'The soup is very expensive.'] },
  { npcEs: 'Is the coffee good?', npcRu: 'Хороший кофе?', answer: "Yes, it's freshly made.", options: ["Yes, it's freshly made.", "Yes, it's very cold.", "No, it's too sweet."] },
  // Дорога
  { npcEs: 'Excuse me, where is the bank?', npcRu: 'Простите, где банк?', answer: "It's two streets away.", options: ["It's two streets away.", "It's very far from here.", "It's in the bank."] },
  { npcEs: 'Is there a pharmacy nearby?', npcRu: 'Есть аптека рядом?', answer: 'Yes, turn right.', options: ['Yes, turn right.', 'Yes, it is very far.', 'No, turn right.'] },
  // Транспорт
  { npcEs: 'What time does the bus leave?', npcRu: 'В котором часу отходит автобус?', answer: 'At half past three.', options: ['At half past three.', 'In half past three.', 'At three and a half.'] },
  // Знакомство
  { npcEs: 'How old are you?', npcRu: 'Сколько тебе лет?', answer: "I'm twenty-five.", options: ["I'm twenty-five.", "I have twenty-five.", "I'm twenty-five years."] },
  // Приглашение
  { npcEs: 'Would you like a coffee?', npcRu: 'Хочешь кофе?', answer: "I'd love one!", options: ["I'd love one!", "I'd love coffee!", "Yes, I want one!"] },
  // Прощание
  { npcEs: 'See you soon!', npcRu: 'До скорого!', answer: 'Likewise! Take care!', options: ['Likewise! Take care!', 'Likewise! See tomorrow!', 'Yes! Take care!'] },
  // Комплимент
  { npcEs: 'What a nice outfit!', npcRu: 'Какой красивый наряд!', answer: 'Thank you so much!', options: ['Thank you so much!', "Yes, it's nice!", "You're welcome!"] },
  // Здоровье
  { npcEs: 'How are you feeling?', npcRu: 'Как ты себя чувствуешь?', answer: 'I have a bit of a headache.', options: ['I have a bit of a headache.', "I'm feeling at home.", 'I have a lot of coffee.'] },
  // Хобби
  { npcEs: 'What do you like doing?', npcRu: 'Что тебе нравится делать?', answer: 'I love dancing and reading.', options: ['I love dancing and reading.', 'I love music a lot.', 'I love dancing and running.'] },
  // Работа
  { npcEs: 'What do you do for work?', npcRu: 'Чем ты занимаешься?', answer: "I'm a student.", options: ["I'm a student.", "I am studying.", "I'm the student."] },
  // Семья
  { npcEs: 'Do you have any siblings?', npcRu: 'Есть братья или сёстры?', answer: 'Yes, I have an older brother.', options: ['Yes, I have an older brother.', 'Yes, I have a younger brother.', 'Yes, I have older brothers.'] },
  // Планы
  { npcEs: 'What are you going to do this evening?', npcRu: 'Что будешь делать сегодня вечером?', answer: "I'm going to study English.", options: ["I'm going to study English.", "I'm going to study tomorrow.", "I'm going to do English."] },
  // Комплимент за язык
  { npcEs: 'Your English is very good!', npcRu: 'Ты очень хорошо говоришь по-английски!', answer: "Thank you, I'm still learning.", options: ["Thank you, I'm still learning.", 'Thank you, I speak very well.', "Thank you, I'm still practising."] },
];

const FILLS_EN = [
  { npcEs: 'What did you eat today?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'I ate ___.', youRu: 'Я ел(а) ___.', words: ['bread', 'cheese', 'chicken', 'fish', 'meat', 'rice', 'soup', 'pizza', 'salad'] },
  { npcEs: 'What do you want to drink?', npcRu: 'Что хочешь выпить?', youEs: 'I want ___.', youRu: 'Я хочу ___.', words: ['water', 'coffee', 'tea', 'juice', 'milk'] },
  { npcEs: 'Where are you going?', npcRu: 'Куда ты идёшь?', youEs: "I'm going to the ___.", youRu: 'Я иду в ___.', words: ['park', 'bank', 'hospital', 'school', 'pharmacy', 'restaurant', 'hotel'] },
  { npcEs: 'How do you prefer to travel?', npcRu: 'Как тебе нравится путешествовать?', youEs: 'I prefer to go by ___.', youRu: 'Я предпочитаю ехать на ___.', words: ['bus', 'car', 'subway', 'taxi', 'train', 'plane', 'bicycle'] },
  { npcEs: "What's the weather like?", npcRu: 'Какая погода?', youEs: 'Today it is ___.', youRu: 'Сегодня ___.', words: ['hot', 'cold', 'warm'] },
  { npcEs: 'Who is waiting for you at home?', npcRu: 'Кто ждёт тебя дома?', youEs: 'My ___ is waiting for me.', youRu: 'Меня ждёт ___.', words: ['mother', 'father', 'brother', 'sister', 'grandmother', 'grandfather'] },
  { npcEs: 'What is your favourite season?', npcRu: 'Какое твоё любимое время года?', youEs: 'My favourite season is ___.', youRu: 'Моё любимое время года — ___.', words: ['spring', 'summer', 'winter'] },
];

const RESPONDS_DE = [
  // Приветствия
  { npcEs: 'Hallo! Wie geht es dir?', npcRu: 'Привет! Как дела?', answer: 'Gut, danke! Und dir?', options: ['Gut, danke! Und dir?', 'Es geht, und dir?', 'Ganz gut, danke!'] },
  { npcEs: 'Wie heißt du?', npcRu: 'Как тебя зовут?', answer: 'Ich heiße Max.', options: ['Ich heiße Max.', 'Ich bin Max gut.', 'Max heißt mich.'] },
  { npcEs: 'Woher kommst du?', npcRu: 'Откуда ты?', answer: 'Ich komme aus Russland.', options: ['Ich komme aus Russland.', 'Ich bin aus Russland.', 'Ich gehe nach Russland.'] },
  { npcEs: 'Vielen Dank!', npcRu: 'Большое спасибо!', answer: 'Bitte sehr!', options: ['Bitte sehr!', 'Kein Problem!', 'Das war nichts.'] },
  { npcEs: 'Guten Appetit!', npcRu: 'Приятного аппетита!', answer: 'Danke, gleichfalls!', options: ['Danke, gleichfalls!', 'Danke, auch Ihnen!', 'Danke, genauso!'] },
  { npcEs: 'Wie spät ist es?', npcRu: 'Который час?', answer: 'Es ist zwei Uhr.', options: ['Es ist zwei Uhr.', 'Es hat zwei Stunden.', 'Zwei Uhr ist richtig.'] },
  // Покупки
  { npcEs: 'Wie viel kostet das?', npcRu: 'Сколько это стоит?', answer: 'Das kostet zehn Euro.', options: ['Das kostet zehn Euro.', 'Es ist sehr teuer.', 'Das macht zehn Euro.'] },
  { npcEs: 'Haben Sie etwas Günstigeres?', npcRu: 'Есть что-нибудь дешевле?', answer: 'Ja, wir haben dieses Angebot.', options: ['Ja, wir haben dieses Angebot.', 'Nein, alles ist teuer.', 'Ja, es ist sehr schön.'] },
  // Погода
  { npcEs: 'Es ist heute so heiß!', npcRu: 'Сегодня так жарко!', answer: 'Ja, ich schwitze!', options: ['Ja, ich schwitze!', 'Ja, mir ist kalt!', 'Ja, es regnet viel!'] },
  { npcEs: 'Glaubst du, es wird regnen?', npcRu: 'Думаешь, будет дождь?', answer: 'Ja, die Wolken sind dunkel.', options: ['Ja, die Wolken sind dunkel.', 'Ja, die Sonne scheint.', 'Nein, der Himmel ist bewölkt.'] },
  // Еда
  { npcEs: 'Was empfiehlst du?', npcRu: 'Что рекомендуешь?', answer: 'Das Hähnchen ist sehr lecker.', options: ['Das Hähnchen ist sehr lecker.', 'Das Hähnchen ist sehr kalt.', 'Die Suppe ist sehr teuer.'] },
  { npcEs: 'Ist der Kaffee gut?', npcRu: 'Хороший кофе?', answer: 'Ja, er ist frisch gemacht.', options: ['Ja, er ist frisch gemacht.', 'Ja, er ist sehr kalt.', 'Nein, er ist zu süß.'] },
  // Дорога
  { npcEs: 'Entschuldigung, wo ist die Bank?', npcRu: 'Простите, где банк?', answer: 'Sie ist zwei Straßen weiter.', options: ['Sie ist zwei Straßen weiter.', 'Sie ist sehr weit weg.', 'Sie ist in der Bank.'] },
  { npcEs: 'Gibt es eine Apotheke in der Nähe?', npcRu: 'Есть аптека рядом?', answer: 'Ja, biegen Sie rechts ab.', options: ['Ja, biegen Sie rechts ab.', 'Ja, sie ist sehr weit.', 'Nein, biegen Sie rechts ab.'] },
  // Транспорт
  { npcEs: 'Wann fährt der Bus ab?', npcRu: 'В котором часу отходит автобус?', answer: 'Um halb vier.', options: ['Um halb vier.', 'In halb vier.', 'Um drei und halb.'] },
  // Знакомство
  { npcEs: 'Wie alt bist du?', npcRu: 'Сколько тебе лет?', answer: 'Ich bin fünfundzwanzig.', options: ['Ich bin fünfundzwanzig.', 'Ich habe fünfundzwanzig.', 'Ich bin fünfundzwanzig Jahre.'] },
  // Приглашение
  { npcEs: 'Möchtest du einen Kaffee?', npcRu: 'Хочешь кофе?', answer: 'Ja, sehr gerne!', options: ['Ja, sehr gerne!', 'Ja, ich liebe Kaffee!', 'Ja, ich möchte einen!'] },
  // Прощание
  { npcEs: 'Bis bald!', npcRu: 'До скорого!', answer: 'Gleichfalls! Pass auf dich auf!', options: ['Gleichfalls! Pass auf dich auf!', 'Gleichfalls! Bis morgen!', 'Ja! Pass auf dich auf!'] },
  // Комплимент
  { npcEs: 'Was für ein schönes Outfit!', npcRu: 'Какой красивый наряд!', answer: 'Vielen Dank!', options: ['Vielen Dank!', 'Ja, es ist schön!', 'Bitte sehr!'] },
  // Здоровье
  { npcEs: 'Wie fühlst du dich?', npcRu: 'Как ты себя чувствуешь?', answer: 'Ich habe ein bisschen Kopfschmerzen.', options: ['Ich habe ein bisschen Kopfschmerzen.', 'Ich fühle mich zu Hause.', 'Ich habe viel Kaffee.'] },
  // Хобби
  { npcEs: 'Was machst du gerne?', npcRu: 'Что тебе нравится делать?', answer: 'Ich tanze und lese gerne.', options: ['Ich tanze und lese gerne.', 'Ich mag Musik sehr.', 'Ich tanze und laufe gerne.'] },
  // Работа
  { npcEs: 'Was machst du beruflich?', npcRu: 'Чем ты занимаешься?', answer: 'Ich bin Student.', options: ['Ich bin Student.', 'Ich studiere.', 'Ich bin der Student.'] },
  // Семья
  { npcEs: 'Hast du Geschwister?', npcRu: 'Есть братья или сёстры?', answer: 'Ja, ich habe einen älteren Bruder.', options: ['Ja, ich habe einen älteren Bruder.', 'Ja, ich habe einen jüngeren Bruder.', 'Ja, ich habe ältere Brüder.'] },
  // Планы
  { npcEs: 'Was machst du heute Abend?', npcRu: 'Что будешь делать сегодня вечером?', answer: 'Ich werde Deutsch lernen.', options: ['Ich werde Deutsch lernen.', 'Ich lerne morgen.', 'Ich werde Deutsch machen.'] },
  // Комплимент за язык
  { npcEs: 'Du sprichst sehr gut Deutsch!', npcRu: 'Ты очень хорошо говоришь по-немецки!', answer: 'Danke, ich lerne noch.', options: ['Danke, ich lerne noch.', 'Danke, ich spreche sehr gut.', 'Danke, ich übe noch.'] },
];

const FILLS_DE = [
  { npcEs: 'Was hast du heute gegessen?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'Ich habe ___ gegessen.', youRu: 'Я ел(а) ___.', words: ['das Brot', 'der Käse', 'das Fleisch', 'das Hähnchen', 'der Fisch', 'der Reis', 'die Suppe', 'die Pizza'] },
  { npcEs: 'Was möchtest du trinken?', npcRu: 'Что хочешь выпить?', youEs: 'Ich möchte ___.', youRu: 'Я хочу ___.', words: ['das Wasser', 'der Kaffee', 'der Tee', 'die Milch', 'der Saft'] },
  { npcEs: 'Wohin gehst du?', npcRu: 'Куда ты идёшь?', youEs: 'Ich gehe zum ___.', youRu: 'Я иду в ___.', words: ['der Park', 'das Krankenhaus', 'das Café', 'das Restaurant', 'das Hotel', 'der Laden'] },
  { npcEs: 'Wie reist du am liebsten?', npcRu: 'Как тебе нравится путешествовать?', youEs: 'Ich reise am liebsten mit dem ___.', youRu: 'Я предпочитаю ехать на ___.', words: ['der Bus', 'das Auto', 'das Taxi', 'Zug', 'Fahrrad', 'Flugzeug'] },
  { npcEs: 'Wie ist das Wetter?', npcRu: 'Какая погода?', youEs: 'Heute ist es ___.', youRu: 'Сегодня ___.', words: ['heiß', 'kalt', 'warm'] },
  { npcEs: 'Wer wartet zu Hause auf dich?', npcRu: 'Кто ждёт тебя дома?', youEs: '___ wartet zu Hause.', youRu: 'Дома ждёт ___.', words: ['Mutter', 'Vater', 'Bruder', 'Schwester', 'Oma', 'Opa'] },
  { npcEs: 'Was ist deine Lieblingsjahreszeit?', npcRu: 'Какое твоё любимое время года?', youEs: 'Meine Lieblingsjahreszeit ist der ___.', youRu: 'Моё любимое время года — ___.', words: ['der Frühling', 'der Sommer', 'der Herbst', 'der Winter'] },
];

const RESPONDS_KO = [
  // Приветствия
  { npcEs: '안녕하세요! 잘 지내세요?', npcRu: 'Здравствуйте! Как поживаете?', answer: '네, 잘 지내요. 그쪽은요?', options: ['네, 잘 지내요. 그쪽은요?', '그저 그래요. 그쪽은요?', '아주 좋아요, 감사합니다!'] },
  { npcEs: '이름이 뭐예요?', npcRu: 'Как тебя зовут?', answer: '제 이름은 민수예요.', options: ['제 이름은 민수예요.', '이름이 좋아요.', '민수를 불러요.'] },
  { npcEs: '어디에서 왔어요?', npcRu: 'Откуда ты?', answer: '러시아에서 왔어요.', options: ['러시아에서 왔어요.', '러시아에 가요.', '여기에서 왔어요.'] },
  { npcEs: '정말 감사합니다!', npcRu: 'Большое спасибо!', answer: '천만에요.', options: ['천만에요.', '괜찮아요?', '부탁해요.'] },
  { npcEs: '맛있게 드세요!', npcRu: 'Приятного аппетита!', answer: '감사합니다, 잘 먹겠습니다!', options: ['감사합니다, 잘 먹겠습니다!', '감사합니다, 잘 잤어요!', '네, 배불러요!'] },
  { npcEs: '지금 몇 시예요?', npcRu: 'Который час?', answer: '두 시예요.', options: ['두 시예요.', '두 살이에요.', '두 개예요.'] },
  // Покупки
  { npcEs: '이거 얼마예요?', npcRu: 'Сколько это стоит?', answer: '만 원이에요.', options: ['만 원이에요.', '만 명이에요.', '만 시예요.'] },
  { npcEs: '더 싼 거 있어요?', npcRu: 'Есть что-нибудь подешевле?', answer: '네, 이건 세일 중이에요.', options: ['네, 이건 세일 중이에요.', '아니요, 다 비싸요.', '네, 아주 예뻐요.'] },
  // Погода
  { npcEs: '오늘 정말 덥네요!', npcRu: 'Сегодня очень жарко!', answer: '네, 땀이 나요!', options: ['네, 땀이 나요!', '네, 추워요!', '네, 비가 많이 와요!'] },
  { npcEs: '비가 올 것 같아요?', npcRu: 'Думаешь, будет дождь?', answer: '네, 구름이 어두워요.', options: ['네, 구름이 어두워요.', '네, 해가 밝아요.', '아니요, 하늘이 흐려요.'] },
  // Еда
  { npcEs: '뭐가 맛있어요?', npcRu: 'Что посоветуешь?', answer: '불고기가 정말 맛있어요.', options: ['불고기가 정말 맛있어요.', '불고기가 아주 차가워요.', '국이 너무 비싸요.'] },
  { npcEs: '커피 맛있어요?', npcRu: 'Хороший кофе?', answer: '네, 방금 만들었어요.', options: ['네, 방금 만들었어요.', '네, 아주 차가워요.', '아니요, 너무 달아요.'] },
  // Дорога
  { npcEs: '실례합니다, 은행이 어디예요?', npcRu: 'Простите, где банк?', answer: '두 블록 더 가세요.', options: ['두 블록 더 가세요.', '아주 멀리 있어요.', '은행 안에 있어요.'] },
  { npcEs: '근처에 약국이 있어요?', npcRu: 'Есть аптека рядом?', answer: '네, 오른쪽으로 가세요.', options: ['네, 오른쪽으로 가세요.', '네, 아주 멀어요.', '아니요, 오른쪽에 있어요.'] },
  // Транспорт
  { npcEs: '버스가 언제 떠나요?', npcRu: 'Когда отходит автобус?', answer: '세 시 반에 떠나요.', options: ['세 시 반에 떠나요.', '세 시 반이 좋아요.', '반 시에 떠나요.'] },
  // Знакомство
  { npcEs: '나이가 어떻게 되세요?', npcRu: 'Сколько тебе лет?', answer: '스물다섯 살이에요.', options: ['스물다섯 살이에요.', '스물다섯 시예요.', '스물다섯이 있어요.'] },
  // Приглашение
  { npcEs: '커피 한잔 할래요?', npcRu: 'Хочешь выпить кофе?', answer: '네, 좋아요!', options: ['네, 좋아요!', '네, 커피예요!', '네, 목말라요!'] },
  // Прощание
  { npcEs: '또 만나요!', npcRu: 'До скорого!', answer: '네, 잘 가요!', options: ['네, 잘 가요!', '네, 잘 자요!', '네, 잘 먹어요!'] },
  // Комплимент
  { npcEs: '옷이 정말 예뻐요!', npcRu: 'Какой красивый наряд!', answer: '정말 감사합니다!', options: ['정말 감사합니다!', '네, 예뻐요!', '천만에요!'] },
  // Здоровье
  { npcEs: '몸은 좀 어때요?', npcRu: 'Как ты себя чувствуешь?', answer: '머리가 조금 아파요.', options: ['머리가 조금 아파요.', '집에 있어요.', '커피가 많이 아파요.'] },
  // Хобби
  { npcEs: '뭐 하는 걸 좋아해요?', npcRu: 'Что тебе нравится делать?', answer: '춤추고 책 읽는 걸 좋아해요.', options: ['춤추고 책 읽는 걸 좋아해요.', '음악이 아주 많아요.', '춤추고 달리는 걸 싫어해요.'] },
  // Работа
  { npcEs: '무슨 일 하세요?', npcRu: 'Чем ты занимаешься?', answer: '저는 학생이에요.', options: ['저는 학생이에요.', '학생을 해요.', '학생이 있어요.'] },
  // Семья
  { npcEs: '형제가 있어요?', npcRu: 'Есть братья или сёстры?', answer: '네, 오빠가 한 명 있어요.', options: ['네, 오빠가 한 명 있어요.', '네, 오빠가 한 살이에요.', '네, 오빠를 몰라요.'] },
  // Планы
  { npcEs: '오늘 저녁에 뭐 해요?', npcRu: 'Что будешь делать сегодня вечером?', answer: '한국어를 공부할 거예요.', options: ['한국어를 공부할 거예요.', '내일 공부할 거예요.', '한국어를 만들 거예요.'] },
  // Комплимент за язык
  { npcEs: '한국어를 정말 잘하시네요!', npcRu: 'Ты очень хорошо говоришь по-корейски!', answer: '감사합니다, 아직 배우고 있어요.', options: ['감사합니다, 아직 배우고 있어요.', '감사합니다, 아주 잘해요.', '감사합니다, 벌써 다 배웠어요.'] },
];

const FILLS_KO = [
  { npcEs: '오늘 뭐 먹었어요?', npcRu: 'Что ты ел(а) сегодня?', youEs: '___ 먹었어요.', youRu: 'Я ел(а) ___.', words: ['밥', '빵', '고기', '생선', '계란', '김치', '라면', '김밥', '치킨'] },
  { npcEs: '뭐 마실래요?', npcRu: 'Что хочешь выпить?', youEs: '___ 주세요.', youRu: 'Мне ___, пожалуйста.', words: ['물', '차', '커피', '우유', '주스'] },
  { npcEs: '기분이 어때요?', npcRu: 'Как ты себя чувствуешь?', youEs: '저는 ___.', youRu: 'Я ___.', words: ['행복해요', '슬퍼요', '기뻐요', '피곤해요', '외로워요'] },
  { npcEs: '어디에 가요?', npcRu: 'Куда ты идёшь?', youEs: '___에 가요.', youRu: 'Я иду в ___.', words: ['공원', '은행', '병원', '약국', '시장', '학교'] },
  { npcEs: '오늘 날씨가 어때요?', npcRu: 'Какая сегодня погода?', youEs: '오늘은 ___.', youRu: 'Сегодня ___.', words: ['더워요', '추워요', '눈이 와요'] },
  { npcEs: '가족 중에 누가 있어요?', npcRu: 'Кто есть в твоей семье?', youEs: '___이/가 있어요.', youRu: 'У меня есть ___.', words: ['엄마', '아빠', '오빠', '언니', '동생', '할머니', '할아버지'] },
  { npcEs: '뭘 타고 다녀요?', npcRu: 'На чём ты ездишь?', youEs: '___ 타고 다녀요.', youRu: 'Я езжу на ___.', words: ['지하철', '버스', '택시', '기차', '자동차', '자전거'] },
];

const RESPONDS_ZH = [
  // Приветствия
  { npcEs: '你好！你好吗？', npcRu: 'Привет! Как дела?', answer: '我很好，谢谢！你呢？', options: ['我很好，谢谢！你呢？', '马马虎虎，你呢？', '很好，谢谢！'] },
  { npcEs: '你叫什么名字？', npcRu: 'Как тебя зовут?', answer: '我叫小明。', options: ['我叫小明。', '我是名字。', '小明叫我。'] },
  { npcEs: '你是哪国人？', npcRu: 'Откуда ты?', answer: '我是俄罗斯人。', options: ['我是俄罗斯人。', '我去俄罗斯。', '俄罗斯很大。'] },
  { npcEs: '非常感谢！', npcRu: 'Большое спасибо!', answer: '不客气。', options: ['不客气。', '没问题吗？', '请坐。'] },
  { npcEs: '现在几点？', npcRu: 'Который час?', answer: '现在两点。', options: ['现在两点。', '现在两个。', '两点很好。'] },
  // Покупки
  { npcEs: '这个多少钱？', npcRu: 'Сколько это стоит?', answer: '十块钱。', options: ['十块钱。', '十个人。', '十点钟。'] },
  { npcEs: '有便宜一点的吗？', npcRu: 'Есть подешевле?', answer: '有，这个在打折。', options: ['有，这个在打折。', '没有，都很贵。', '有，很漂亮。'] },
  // Погода
  { npcEs: '今天真热！', npcRu: 'Сегодня так жарко!', answer: '是啊，我在出汗！', options: ['是啊，我在出汗！', '是啊，很冷！', '是啊，下大雨！'] },
  { npcEs: '你觉得会下雨吗？', npcRu: 'Думаешь, будет дождь?', answer: '会，云很黑。', options: ['会，云很黑。', '会，太阳很亮。', '不会，天很阴。'] },
  // Еда
  { npcEs: '你推荐什么菜？', npcRu: 'Что посоветуешь?', answer: '饺子很好吃。', options: ['饺子很好吃。', '饺子很冷。', '汤很贵。'] },
  { npcEs: '咖啡好喝吗？', npcRu: 'Хороший кофе?', answer: '好喝，刚做的。', options: ['好喝，刚做的。', '好喝，很冷。', '不好，太甜了。'] },
  // Дорога
  { npcEs: '请问，银行在哪儿？', npcRu: 'Простите, где банк?', answer: '往前走两条街。', options: ['往前走两条街。', '很远很远。', '在银行里。'] },
  { npcEs: '附近有药店吗？', npcRu: 'Есть аптека рядом?', answer: '有，往右拐。', options: ['有，往右拐。', '有，很远。', '没有，往右拐。'] },
  // Транспорт
  { npcEs: '公共汽车几点开？', npcRu: 'Когда отходит автобус?', answer: '三点半开。', options: ['三点半开。', '三个半开。', '半点三开。'] },
  // Знакомство
  { npcEs: '你多大了？', npcRu: 'Сколько тебе лет?', answer: '我二十五岁。', options: ['我二十五岁。', '我二十五点。', '我有二十五。'] },
  // Приглашение
  { npcEs: '要不要喝杯咖啡？', npcRu: 'Хочешь выпить кофе?', answer: '好啊，太好了！', options: ['好啊，太好了！', '好啊，是咖啡！', '好啊，我渴了！'] },
  // Прощание
  { npcEs: '再见！', npcRu: 'До свидания!', answer: '再见！路上小心！', options: ['再见！路上小心！', '再见！晚安！', '再见！吃饭！'] },
  // Комплимент
  { npcEs: '你的衣服真漂亮！', npcRu: 'Какой красивый наряд!', answer: '谢谢你！', options: ['谢谢你！', '是的，很漂亮！', '不客气！'] },
  // Здоровье
  { npcEs: '你感觉怎么样？', npcRu: 'Как ты себя чувствуешь?', answer: '头有点疼。', options: ['头有点疼。', '我在家里。', '咖啡很疼。'] },
  // Хобби
  { npcEs: '你喜欢做什么？', npcRu: 'Что тебе нравится делать?', answer: '我喜欢跳舞和看书。', options: ['我喜欢跳舞和看书。', '音乐很多。', '我不喜欢跳舞和跑步。'] },
  // Работа
  { npcEs: '你做什么工作？', npcRu: 'Чем ты занимаешься?', answer: '我是学生。', options: ['我是学生。', '我做学生。', '学生是我的。'] },
  // Семья
  { npcEs: '你有兄弟姐妹吗？', npcRu: 'Есть братья или сёстры?', answer: '有，我有一个哥哥。', options: ['有，我有一个哥哥。', '有，哥哥一岁。', '有，我不认识哥哥。'] },
  // Планы
  { npcEs: '你今晚做什么？', npcRu: 'Что будешь делать сегодня вечером?', answer: '我要学习中文。', options: ['我要学习中文。', '我明天学习。', '我做中文。'] },
  // Комплимент за язык
  { npcEs: '你的中文说得真好！', npcRu: 'Ты очень хорошо говоришь по-китайски!', answer: '谢谢，我还在学。', options: ['谢谢，我还在学。', '谢谢，我说得很好。', '谢谢，我都学完了。'] },
];

const FILLS_ZH = [
  { npcEs: '你今天吃了什么？', npcRu: 'Что ты ел(а) сегодня?', youEs: '我吃了___。', youRu: 'Я ел(а) ___.', words: ['米饭', '面条', '饺子', '面包', '鸡蛋', '苹果'] },
  { npcEs: '你想喝什么？', npcRu: 'Что хочешь выпить?', youEs: '我想喝___。', youRu: 'Я хочу выпить ___.', words: ['水', '茶', '咖啡', '牛奶', '果汁'] },
  { npcEs: '你去哪儿？', npcRu: 'Куда ты идёшь?', youEs: '我去___。', youRu: 'Я иду в ___.', words: ['公园', '银行', '医院', '学校', '商店', '市场'] },
  { npcEs: '你怎么去？', npcRu: 'На чём поедешь?', youEs: '我坐___去。', youRu: 'Я поеду на ___.', words: ['公共汽车', '地铁', '出租车', '火车', '飞机'] },
  { npcEs: '今天天气怎么样？', npcRu: 'Какая сегодня погода?', youEs: '今天___。', youRu: 'Сегодня ___.', words: ['下雨', '下雪', '很热', '很冷'] },
  { npcEs: '你家有谁？', npcRu: 'Кто есть в твоей семье?', youEs: '我家有___。', youRu: 'В моей семье есть ___.', words: ['妈妈', '爸爸', '哥哥', '姐姐', '弟弟', '妹妹'] },
  { npcEs: '你今天感觉怎么样？', npcRu: 'Как ты себя сегодня чувствуешь?', youEs: '我很___。', youRu: 'Я ___.', words: ['开心', '高兴', '累', '难过'] },
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
  const responds = lang === 'en' ? RESPONDS_EN : lang === 'de' ? RESPONDS_DE : lang === 'ko' ? RESPONDS_KO : lang === 'zh' ? RESPONDS_ZH : RESPONDS_ES;
  const fills = lang === 'en' ? FILLS_EN : lang === 'de' ? FILLS_DE : lang === 'ko' ? FILLS_KO : lang === 'zh' ? FILLS_ZH : FILLS_ES;
  const CARDS = getCards();

  if (Math.random() < 0.45) {
    const r = responds[(Math.random() * responds.length) | 0];
    return { kind: 'respond', npcEs: r.npcEs, npcRu: r.npcRu, answer: r.answer, options: shuffle(r.options) };
  }
  const t = fills[(Math.random() * fills.length) | 0];
  // words — белый список подходящих по смыслу ответов; дистракторы только из него,
  // чтобы не появлялись бессмысленные варианты из чужих тем
  const pool = t.words
    ? CARDS.filter(c => t.words.includes(c.es))
    : CARDS.filter(c => c.region === t.pool && c.es.split(' ').length <= 4);
  if (pool.length < 3) { const r = responds[(Math.random() * responds.length) | 0]; return { kind: 'respond', npcEs: r.npcEs, npcRu: r.npcRu, answer: r.answer, options: shuffle(r.options) }; }
  const target = pool[(Math.random() * pool.length) | 0];
  const distr = shuffle(pool.filter(c => c !== target)).slice(0, 2).map(c => bare(c.es));
  const options = shuffle([bare(target.es), ...distr]);
  return { kind: 'fill', npcEs: t.npcEs, npcRu: t.npcRu, youEs: t.youEs, youRu: t.youRu, hint: target.ru, answer: bare(target.es), options, card: target };
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
