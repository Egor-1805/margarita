// ============================================================
//  Margarita — персонаж (SVG-аватар девочки) + каталог магазина
// ============================================================

export const DEFAULT_LOOK = {
  gender: 'f',          // 'f' девочка | 'm' мальчик
  skin: '#f1c9a5',
  hairColor: '#5a3b22',
  hairStyle: 'curly',   // причёска (по умолчанию кудри)
  hat: 'none',
  shirt: '#e07aa8',
  acc: 'none',
};

const cir = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

// ---------- волосы: задний слой (за головой) ----------
function hairBack(L) {
  const c = L.hairColor;
  switch (L.hairStyle) {
    case 'short':
      return '';
    case 'curly':
      return `<g>${cir(34, 40, 13, c)}${cir(86, 40, 13, c)}${cir(60, 22, 15, c)}
        ${cir(30, 56, 11, c)}${cir(90, 56, 11, c)}</g>`;
    case 'long':
      return `<g>
        <path d="M30 40 Q26 80 34 104 L46 104 Q40 70 44 40 Z" fill="${c}"/>
        <path d="M90 40 Q94 80 86 104 L74 104 Q80 70 76 40 Z" fill="${c}"/>
      </g>`;
    case 'ponytail':
      return `<g>${cir(60, 20, 14, c)}
        <path d="M84 30 Q104 44 100 78 Q96 100 84 96 Q92 70 78 44 Z" fill="${c}"/>
        ${cir(86, 30, 7, c)}</g>`;
    case 'bun':
      return `<g>${cir(60, 14, 12, c)}<circle cx="60" cy="14" r="12" fill="${c}"/></g>`;
    default: // straight
      return `<g>
        <path d="M31 40 Q29 70 35 92 L44 92 Q40 64 43 40 Z" fill="${c}"/>
        <path d="M89 40 Q91 70 85 92 L76 92 Q80 64 77 40 Z" fill="${c}"/>
      </g>`;
  }
}

// ---------- волосы: передний слой (чёлка / контур у лица) ----------
function hairFront(L) {
  const c = L.hairColor;
  switch (L.hairStyle) {
    case 'short':
      return `<path d="M32 47 Q32 15 60 14 Q88 15 88 47 Q83 27 60 27 Q37 27 32 47 Z" fill="${c}"/>`;
    case 'curly':
      // пышная шапка кудрей по контуру лба
      return `<g>
        ${cir(40, 30, 10, c)}${cir(52, 23, 11, c)}${cir(64, 22, 11, c)}${cir(76, 25, 10, c)}
        ${cir(85, 35, 9, c)}${cir(34, 42, 9, c)}${cir(33, 54, 8, c)}
        ${cir(87, 44, 9, c)}${cir(88, 56, 8, c)}${cir(47, 27, 8, c)}${cir(71, 23, 9, c)}
      </g>`;
    case 'ponytail':
      return `<path d="M33 46 Q34 19 60 18 Q86 19 87 46 Q80 28 60 28 Q40 28 33 46 Z" fill="${c}"/>
        <path d="M33 46 Q34 30 44 26 L44 50 Z" fill="${c}"/>`;
    case 'bun':
      return `<path d="M34 44 Q35 20 60 19 Q85 20 86 44 Q80 30 60 30 Q40 30 34 44 Z" fill="${c}"/>`;
    case 'long':
      return `<g>
        <path d="M32 46 Q33 18 60 17 Q87 18 88 46 Q82 27 60 27 Q38 27 32 46 Z" fill="${c}"/>
        <path d="M33 44 Q32 70 36 90 L42 90 Q39 62 41 44 Z" fill="${c}"/>
        <path d="M87 44 Q88 70 84 90 L78 90 Q81 62 79 44 Z" fill="${c}"/>
      </g>`;
    default: // straight
      return `<path d="M33 47 Q34 18 60 17 Q86 18 87 47 Q83 30 70 28 Q66 38 60 38 Q54 38 50 28 Q37 30 33 47 Z" fill="${c}"/>`;
  }
}

// ---------- шляпы ----------
function hatSVG(L) {
  switch (L.hat) {
    case 'gorra':
      return `<g>
        <path d="M32 36 Q60 6 88 36 Q60 26 32 36 Z" fill="#e76f51"/>
        <path d="M30 36 Q44 31 60 32 L60 40 Q42 40 30 41 Z" fill="#c2563c"/>
        <circle cx="60" cy="14" r="3" fill="#fff" opacity=".8"/>
      </g>`;
    case 'sombrero':
      return `<g>
        <ellipse cx="60" cy="34" rx="46" ry="11" fill="#e7c873"/>
        <ellipse cx="60" cy="33" rx="46" ry="9" fill="#f0d68c"/>
        <path d="M40 33 Q42 8 60 7 Q78 8 80 33 Z" fill="#e7c873"/>
        <rect x="40" y="27" width="40" height="6" rx="3" fill="#bc7c3c"/>
      </g>`;
    case 'boina':
      return `<g>
        <ellipse cx="58" cy="22" rx="32" ry="14" fill="#3a4a6b"/>
        <ellipse cx="58" cy="20" rx="32" ry="12" fill="#46587f"/>
        <circle cx="58" cy="11" r="3.5" fill="#2c3a57"/>
      </g>`;
    case 'corona':
      return `<g>
        <path d="M36 28 L36 12 L46 22 L60 6 L74 22 L84 12 L84 28 Z" fill="#f4c430" stroke="#d8a200" stroke-width="1.5"/>
        <circle cx="46" cy="20" r="3" fill="#e7533a"/>
        <circle cx="60" cy="16" r="3.5" fill="#3a6ea5"/>
        <circle cx="74" cy="20" r="3" fill="#3f8a4f"/>
      </g>`;
    case 'lazo': // бантик
      return `<g>
        <path d="M60 24 L46 16 Q40 22 46 30 Z" fill="#e23a6e"/>
        <path d="M60 24 L74 16 Q80 22 74 30 Z" fill="#e23a6e"/>
        <circle cx="60" cy="24" r="4" fill="#c22a58"/>
      </g>`;
    case 'flor': // цветок в волосах
      return `<g>
        ${cir(78, 30, 4, '#fff')}${cir(85, 30, 4, '#fff')}${cir(81, 25, 4, '#fff')}${cir(81, 35, 4, '#fff')}
        ${cir(81, 30, 3, '#f4c430')}
      </g>`;
    default: return '';
  }
}

// ---------- аксессуары ----------
function accSVG(L) {
  switch (L.acc) {
    case 'gafas':
      return `<g fill="none" stroke="#3a3a3a" stroke-width="2.4">
        <circle cx="51" cy="46" r="8" fill="#ffffff" fill-opacity=".25"/>
        <circle cx="69" cy="46" r="8" fill="#ffffff" fill-opacity=".25"/>
        <line x1="59" y1="46" x2="61" y2="46"/>
      </g>`;
    case 'sol':
      return `<g stroke="#222" stroke-width="2">
        <path d="M43 43 h16 v6 a8 8 0 0 1 -16 0 z" fill="#2a2a2a"/>
        <path d="M61 43 h16 v6 a8 8 0 0 1 -16 0 z" fill="#2a2a2a"/>
        <line x1="59" y1="44" x2="61" y2="44"/>
      </g>`;
    case 'bufanda':
      return `<g>
        <path d="M44 70 Q60 80 76 70 L76 78 Q60 86 44 78 Z" fill="#e76f51"/>
        <rect x="52" y="76" width="9" height="20" rx="3" fill="#d6604a"/>
      </g>`;
    case 'pendientes': // серёжки
      return `<g>${cir(35, 56, 3, '#f4c430')}${cir(85, 56, 3, '#f4c430')}</g>`;
    default: return '';
  }
}

// ---------- основной рендер ----------
export function avatarSVG(look = {}) {
  const L = { ...DEFAULT_LOOK, ...look };
  const girl = L.gender !== 'm';
  const pants = '#46587f';
  const shoe = girl ? '#c44e7a' : '#5a4636';
  // тело: девочка — платье, мальчик — рубашка + штаны
  const body = girl
    ? `<path d="M33 80 H87 L94 120 Q60 132 26 120 Z" fill="${L.shirt}"/>`
    : `<rect x="34" y="80" width="52" height="30" rx="9" fill="${L.shirt}"/>
       <rect x="36" y="106" width="48" height="14" rx="4" fill="${pants}"/>`;
  const legs = girl
    ? `<rect x="50" y="118" width="8" height="20" rx="4" fill="${L.skin}"/><rect x="62" y="118" width="8" height="20" rx="4" fill="${L.skin}"/>`
    : `<rect x="50" y="118" width="8" height="20" rx="4" fill="${pants}"/><rect x="62" y="118" width="8" height="20" rx="4" fill="${pants}"/>`;
  // лицо: у девочки реснички и розовые губы/щёчки
  const lashes = girl ? `<g stroke="#3a2a22" stroke-width="1.4" stroke-linecap="round">
      <line x1="46" y1="43" x2="49" y2="45"/><line x1="74" y1="43" x2="71" y2="45"/></g>` : '';
  const mouth = girl
    ? `<path d="M52 57 Q60 64 68 57" stroke="#c44e7a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<path d="M53 57 Q60 62 67 57" stroke="#a9603f" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const cheeks = girl
    ? `<circle cx="45" cy="54" r="3.8" fill="#f59ab0" opacity=".55"/><circle cx="75" cy="54" r="3.8" fill="#f59ab0" opacity=".55"/>` : '';
  return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" class="avatar-svg" preserveAspectRatio="xMidYMid meet">
    <ellipse cx="60" cy="144" rx="30" ry="6" fill="#000" opacity=".12"/>
    ${legs}
    <ellipse cx="52" cy="139" rx="7" ry="4.5" fill="${shoe}"/>
    <ellipse cx="68" cy="139" rx="7" ry="4.5" fill="${shoe}"/>
    <rect x="29" y="82" width="11" height="32" rx="5.5" fill="${L.shirt}"/>
    <rect x="80" y="82" width="11" height="32" rx="5.5" fill="${L.shirt}"/>
    <circle cx="34" cy="114" r="5.5" fill="${L.skin}"/>
    <circle cx="86" cy="114" r="5.5" fill="${L.skin}"/>
    ${body}
    <rect x="53" y="66" width="14" height="14" fill="${L.skin}"/>
    ${hairBack(L)}
    <circle cx="60" cy="46" r="27" fill="${L.skin}"/>
    ${hairFront(L)}
    <circle cx="51" cy="47" r="3.2" fill="#3a2a22"/>
    <circle cx="69" cy="47" r="3.2" fill="#3a2a22"/>
    <circle cx="52" cy="46" r="1" fill="#fff"/><circle cx="70" cy="46" r="1" fill="#fff"/>
    ${lashes}${mouth}${cheeks}
    ${accSVG(L)}
    ${hatSVG(L)}
  </svg>`;
}

// ============================================================
//  Каталог магазина
// ============================================================

export const COSMETICS = [
  // причёски
  { id: 'style_curly',    slot: 'hairStyle', cat: 'Причёска', name: 'Кудри',     emoji: '🌀', val: 'curly',    cost: 0 },
  { id: 'style_short',    slot: 'hairStyle', cat: 'Причёска', name: 'Короткие',  emoji: '✂️', val: 'short',    cost: 0 },
  { id: 'style_straight', slot: 'hairStyle', cat: 'Причёска', name: 'Прямые',    emoji: '💇‍♀️', val: 'straight', cost: 70 },
  { id: 'style_ponytail', slot: 'hairStyle', cat: 'Причёска', name: 'Хвостик',   emoji: '🎀', val: 'ponytail', cost: 100 },
  { id: 'style_long',     slot: 'hairStyle', cat: 'Причёска', name: 'Длинные',   emoji: '👩', val: 'long',     cost: 120 },
  { id: 'style_bun',      slot: 'hairStyle', cat: 'Причёска', name: 'Пучок',     emoji: '🍡', val: 'bun',      cost: 120 },
  // цвет волос
  { id: 'hair_brown',  slot: 'hairColor', cat: 'Цвет волос', name: 'Тёмные', emoji: '🟤', val: '#5a3b22', cost: 0 },
  { id: 'hair_black',  slot: 'hairColor', cat: 'Цвет волос', name: 'Чёрные', emoji: '⚫', val: '#2b2620', cost: 60 },
  { id: 'hair_blond',  slot: 'hairColor', cat: 'Цвет волос', name: 'Блонд',  emoji: '👱‍♀️', val: '#d9a441', cost: 90 },
  { id: 'hair_red',    slot: 'hairColor', cat: 'Цвет волос', name: 'Рыжие',  emoji: '🦰', val: '#b5532a', cost: 90 },
  { id: 'hair_pink',   slot: 'hairColor', cat: 'Цвет волос', name: 'Розовые', emoji: '🌸', val: '#e07aa8', cost: 160 },
  { id: 'hair_white',  slot: 'hairColor', cat: 'Цвет волос', name: 'Белые',  emoji: '🤍', val: '#e8e2d8', cost: 160 },
  // голова (шляпы/аксессуары для волос)
  { id: 'hat_none',    slot: 'hat', cat: 'Голова', name: 'Ничего',   emoji: '🙂', val: 'none',     cost: 0 },
  { id: 'hat_lazo',    slot: 'hat', cat: 'Голова', name: 'Бантик',   emoji: '🎀', val: 'lazo',     cost: 50 },
  { id: 'hat_flor',    slot: 'hat', cat: 'Голова', name: 'Цветок',   emoji: '🌺', val: 'flor',     cost: 70 },
  { id: 'hat_gorra',   slot: 'hat', cat: 'Голова', name: 'Кепка',    emoji: '🧢', val: 'gorra',    cost: 80 },
  { id: 'hat_boina',   slot: 'hat', cat: 'Голова', name: 'Берет',    emoji: '🎨', val: 'boina',    cost: 120 },
  { id: 'hat_sombrero',slot: 'hat', cat: 'Голова', name: 'Сомбреро', emoji: '👒', val: 'sombrero', cost: 180 },
  { id: 'hat_corona',  slot: 'hat', cat: 'Голова', name: 'Корона',   emoji: '👑', val: 'corona',   cost: 600 },
  // одежда
  { id: 'shirt_pink',   slot: 'shirt', cat: 'Одежда', name: 'Розовая',    emoji: '🌸', val: '#e07aa8', cost: 0 },
  { id: 'shirt_teal',   slot: 'shirt', cat: 'Одежда', name: 'Бирюзовая',  emoji: '🟦', val: '#4d908e', cost: 60 },
  { id: 'shirt_red',    slot: 'shirt', cat: 'Одежда', name: 'Красная',    emoji: '🟥', val: '#e76f51', cost: 70 },
  { id: 'shirt_blue',   slot: 'shirt', cat: 'Одежда', name: 'Синяя',      emoji: '🔵', val: '#3a6ea5', cost: 70 },
  { id: 'shirt_gold',   slot: 'shirt', cat: 'Одежда', name: 'Золотая',    emoji: '🟡', val: '#f4a259', cost: 130 },
  { id: 'shirt_purple', slot: 'shirt', cat: 'Одежда', name: 'Фиолетовая', emoji: '🟪', val: '#7b5ea7', cost: 130 },
  // аксессуары
  { id: 'acc_none',       slot: 'acc', cat: 'Аксессуар', name: 'Ничего',         emoji: '🚫', val: 'none',     cost: 0 },
  { id: 'acc_pendientes', slot: 'acc', cat: 'Аксессуар', name: 'Серёжки',        emoji: '💎', val: 'pendientes', cost: 80 },
  { id: 'acc_gafas',      slot: 'acc', cat: 'Аксессуар', name: 'Очки',           emoji: '👓', val: 'gafas',    cost: 90 },
  { id: 'acc_sol',        slot: 'acc', cat: 'Аксессуар', name: 'Очки от солнца', emoji: '🕶️', val: 'sol',      cost: 140 },
  { id: 'acc_bufanda',    slot: 'acc', cat: 'Аксессуар', name: 'Шарф',           emoji: '🧣', val: 'bufanda',  cost: 90 },
];

// Темы города (косметика). val — ключ темы в town.js
export const TOWN_SKINS = [
  { id: 'town_dia',        name: 'Ясный день',  emoji: '☀️', val: 'dia',        cost: 0 },
  { id: 'town_primavera',  name: 'Весна',       emoji: '🌷', val: 'primavera',  cost: 120 },
  { id: 'town_atardecer',  name: 'Закат',       emoji: '🌇', val: 'atardecer',  cost: 200 },
  { id: 'town_noche',      name: 'Ночь',        emoji: '🌙', val: 'noche',      cost: 250 },
  { id: 'town_nevado',     name: 'Зима',        emoji: '❄️', val: 'nevado',     cost: 300 },
];

// Функциональные улучшения
export const UPGRADES = [
  { id: 'up_new',    name: '+5 новых слов в день', desc: 'Учи больше каждый день. Можно покупать несколько раз.', emoji: '🆕', cost: 200, type: 'newPerDay', repeatable: true },
  { id: 'up_freeze', name: 'Заморозка серии',      desc: 'Спасает 🔥-серию за один пропущенный день. До 3 штук.',  emoji: '🧊', cost: 150, type: 'freeze',    repeatable: true, max: 3 },
  { id: 'up_hint',   name: 'Подсказки в наборе',   desc: 'Показывает первую букву слова в режиме ввода.',          emoji: '💡', cost: 300, type: 'hint',      oneTime: true },
  { id: 'up_double', name: '×2 монеты (10 повторов)', desc: 'Удвоенные монеты за следующие 10 карточек.',          emoji: '✨', cost: 250, type: 'double',    repeatable: true },
];
