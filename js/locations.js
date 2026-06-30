// ============================================================
//  Карта: локации, прохожие, сундуки, диалоги, подбор слов (SRS)
// ============================================================
import { CARDS as CARDS_ES } from './cards.js';
import { CARDS as CARDS_EN_BASE } from './cards-en.js';
import { CARDS_EXTRA as CARDS_EN_EXTRA } from './cards-en-extra.js';
import { CARDS as CARDS_DE } from './cards-de.js';
import { CARDS_DE_EXTRA_A } from './cards-de-extra-a.js';
import { CARDS_DE_EXTRA_B } from './cards-de-extra-b.js';
import * as store from './store.js';
import * as srs from './srs.js';

const CARDS_EN = [...CARDS_EN_BASE, ...CARDS_EN_EXTRA];
const CARDS_DE_ALL = [...CARDS_DE, ...CARDS_DE_EXTRA_A, ...CARDS_DE_EXTRA_B];

export function getCards() {
  const lang = store.getGame().lang || 'es';
  if (lang === 'en') return CARDS_EN;
  if (lang === 'de') return CARDS_DE_ALL;
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
  [10, 8], [19, 9], [32, 9], [8, 15], [34, 15], [22, 12],
  [14, 21], [28, 21], [18, 23], [32, 24], [6, 23], [24, 17],
  [40, 9], [16, 16], [27, 14],
];

// сундуки — открываешь → случайная мини-игра + бонус-монеты
export const CHEST_SPOTS = [
  { id: 'c1', x: 17, y: 13 }, { id: 'c2', x: 27, y: 18 }, { id: 'c3', x: 9, y: 12 },
  { id: 'c4', x: 35, y: 17 }, { id: 'c5', x: 20, y: 22 }, { id: 'c6', x: 31, y: 11 },
  { id: 'c7', x: 14, y: 18 }, { id: 'c8', x: 35, y: 24 },
  { id: 'dev', x: 1, y: 1, secret: true },
];

// фиксированные деревья (аккуратно расставлены по карте)
export const TREE_SPOTS = [
  [2,2],[11,2],[20,2],[29,2],[40,2],
  [2,10],[12,10],[20,10],[29,10],[40,10],
  [2,17],[43,17],
  [2,24],[12,24],[20,24],[29,24],[40,24],
  [1,30],[12,30],[20,30],[29,30],[40,30],
];

// кусты (заполняют пустые места)
export const BUSH_SPOTS = [
  [5,2],[15,2],[25,2],[35,2],
  [5,10],[25,10],[35,10],
  [5,24],[25,24],[35,24],
  [5,30],[25,30],[35,30],
];

// скамейки
export const BENCH_SPOTS = [
  {x:12,y:8},{x:35,y:8},
  {x:9,y:13},{x:37,y:13},
  {x:9,y:21},{x:37,y:21},
  {x:21,y:12},{x:25,y:12},
];

// фонари (на пересечениях дорожек)
export const LAMP_SPOTS = [
  [10,7],[22,7],[34,7],
  [10,16],[22,16],[34,16],
  [10,22],[22,22],[34,22],
];

// памятники и украшения (интерактивные)
export const MONUMENT_SPOTS = [
  { x:24, y:11, type:'statue',         label:'📜 Статуя',  region:1 },
  { x:16, y:13, type:'arch',           label:'🏛️ Арка',    region:6 },
  { x:28, y:13, type:'obelisk',        label:'🗿 Обелиск', region:2 },
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

const FILLS_ES = [
  { npcEs: '¿Qué comiste hoy?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'Comí ___.', youRu: 'Я ел(а) ___.', pool: 5 },
  { npcEs: '¿Qué quieres beber?', npcRu: 'Что хочешь выпить?', youEs: 'Quiero ___.', youRu: 'Я хочу ___.', pool: 5 },
  { npcEs: '¿De qué color es tu ropa?', npcRu: 'Какого цвета твоя одежда?', youEs: 'Es ___.', youRu: 'Она ___.', pool: 7 },
  { npcEs: '¿Cómo te sientes?', npcRu: 'Как ты себя чувствуешь?', youEs: 'Me siento ___.', youRu: 'Я чувствую себя ___.', pool: 9 },
  { npcEs: '¿Adónde vas?', npcRu: 'Куда ты идёшь?', youEs: 'Voy al ___.', youRu: 'Я иду в ___.', pool: 6 },
  { npcEs: '¿Qué tiempo hace?', npcRu: 'Какая погода?', youEs: 'Hoy ___.', youRu: 'Сегодня ___.', pool: 10 },
  { npcEs: 'Dime un piropo 😊', npcRu: 'Скажи мне комплимент 😊', youEs: '¡Eres ___!', youRu: 'Ты ___!', pool: 13 },
  { npcEs: '¿Cómo se llama tu madre?', npcRu: 'Как зовут твою маму?', youEs: 'Mi madre se llama ___.', youRu: 'Мою маму зовут ___.', pool: 4 },
  { npcEs: '¿Cómo prefieres viajar?', npcRu: 'Как тебе нравится путешествовать?', youEs: 'Prefiero ir en ___.', youRu: 'Я предпочитаю ехать на ___.', pool: 6 },
  { npcEs: '¿Cuántos días tiene una semana?', npcRu: 'Сколько дней в неделе?', youEs: 'Una semana tiene ___ días.', youRu: 'В неделе ___ дней.', pool: 2 },
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
  { npcEs: 'What did you eat today?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'I ate ___.', youRu: 'Я ел(а) ___.', pool: 5 },
  { npcEs: 'What do you want to drink?', npcRu: 'Что хочешь выпить?', youEs: 'I want ___.', youRu: 'Я хочу ___.', pool: 5 },
  { npcEs: 'What colour is your outfit?', npcRu: 'Какого цвета твой наряд?', youEs: "It's ___.", youRu: 'Он ___.', pool: 7 },
  { npcEs: 'How do you feel?', npcRu: 'Как ты себя чувствуешь?', youEs: 'I feel ___.', youRu: 'Я чувствую себя ___.', pool: 9 },
  { npcEs: 'Where are you going?', npcRu: 'Куда ты идёшь?', youEs: "I'm going to the ___.", youRu: 'Я иду в ___.', pool: 6 },
  { npcEs: "What's the weather like?", npcRu: 'Какая погода?', youEs: 'Today it is ___.', youRu: 'Сегодня ___.', pool: 10 },
  { npcEs: 'Say something nice 😊', npcRu: 'Скажи что-нибудь приятное 😊', youEs: 'You are ___!', youRu: 'Ты ___!', pool: 13 },
  { npcEs: "What's your mother's name?", npcRu: 'Как зовут твою маму?', youEs: 'My mother is called ___.', youRu: 'Мою маму зовут ___.', pool: 4 },
  { npcEs: 'How do you prefer to travel?', npcRu: 'Как тебе нравится путешествовать?', youEs: 'I prefer to go by ___.', youRu: 'Я предпочитаю ехать на ___.', pool: 6 },
  { npcEs: 'How many days are in a week?', npcRu: 'Сколько дней в неделе?', youEs: 'A week has ___ days.', youRu: 'В неделе ___ дней.', pool: 2 },
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
  { npcEs: 'Was hast du heute gegessen?', npcRu: 'Что ты ел(а) сегодня?', youEs: 'Ich habe ___ gegessen.', youRu: 'Я ел(а) ___.', pool: 5 },
  { npcEs: 'Was möchtest du trinken?', npcRu: 'Что хочешь выпить?', youEs: 'Ich möchte ___.', youRu: 'Я хочу ___.', pool: 5 },
  { npcEs: 'Welche Farbe hat deine Kleidung?', npcRu: 'Какого цвета твоя одежда?', youEs: 'Sie ist ___.', youRu: 'Она ___.', pool: 7 },
  { npcEs: 'Wie fühlst du dich?', npcRu: 'Как ты себя чувствуешь?', youEs: 'Ich fühle mich ___.', youRu: 'Я чувствую себя ___.', pool: 9 },
  { npcEs: 'Wohin gehst du?', npcRu: 'Куда ты идёшь?', youEs: 'Ich gehe zum ___.', youRu: 'Я иду в ___.', pool: 6 },
  { npcEs: 'Wie ist das Wetter?', npcRu: 'Какая погода?', youEs: 'Heute ist es ___.', youRu: 'Сегодня ___.', pool: 10 },
  { npcEs: 'Sag etwas Nettes 😊', npcRu: 'Скажи что-нибудь приятное 😊', youEs: 'Du bist ___!', youRu: 'Ты ___!', pool: 13 },
  { npcEs: 'Wie heißt deine Mutter?', npcRu: 'Как зовут твою маму?', youEs: 'Meine Mutter heißt ___.', youRu: 'Мою маму зовут ___.', pool: 4 },
  { npcEs: 'Wie reist du am liebsten?', npcRu: 'Как тебе нравится путешествовать?', youEs: 'Ich reise am liebsten mit dem ___.', youRu: 'Я предпочитаю ехать на ___.', pool: 6 },
  { npcEs: 'Wie viele Tage hat eine Woche?', npcRu: 'Сколько дней в неделе?', youEs: 'Eine Woche hat ___ Tage.', youRu: 'В неделе ___ дней.', pool: 2 },
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
  let distrPool = pool.filter(c => c !== target);
  if (distrPool.length < 2) {
    distrPool = CARDS.filter(c => c !== target && c.es.split(' ').length <= 3 && c.region === t.pool);
  }
  if (distrPool.length < 2) {
    distrPool = CARDS.filter(c => c !== target && c.es.split(' ').length <= 3);
  }
  const distr = shuffle(distrPool).slice(0, 2).map(c => bare(c.es));
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
