// ============================================================
//  Pueblo — рендер растущего городка (чистый SVG)
//  Каждый регион = здание, которое растёт по мере освоения слов.
//  Стадии: 0 пустырь · 1 фундамент · 2 домик · 3 дом · 4 дом+декор
// ============================================================

import { REGIONS } from './cards.js';

function stage(mastered, total) {
  if (total === 0) return 0;
  const p = mastered / total;
  if (mastered === 0) return 0;
  if (p < 0.25) return 1;
  if (p < 0.55) return 2;
  if (p < 0.95) return 3;
  return 4;
}

// одно здание на «земле» в точке (x, groundY)
function building(region, st, x, groundY, i) {
  const col = region.color;
  const sway = (i % 2 === 0) ? '' : ' style="animation-delay:.6s"';
  if (st === 0) {
    // пустырь — табличка-плот
    return `
      <g class="plot" opacity="0.55">
        <ellipse cx="${x}" cy="${groundY + 2}" rx="26" ry="6" fill="#000" opacity="0.07"/>
        <rect x="${x - 18}" y="${groundY - 14}" width="36" height="14" rx="3" fill="#cdb89a"/>
        <text x="${x}" y="${groundY - 3}" text-anchor="middle" font-size="11">${region.emoji}</text>
        <line x1="${x}" y1="${groundY}" x2="${x}" y2="${groundY - 14}" stroke="#a98f6b" stroke-width="2"/>
      </g>`;
  }
  if (st === 1) {
    // фундамент
    return `
      <g>
        <ellipse cx="${x}" cy="${groundY + 2}" rx="30" ry="7" fill="#000" opacity="0.08"/>
        <rect x="${x - 24}" y="${groundY - 16}" width="48" height="16" rx="2" fill="#b9a07f"/>
        <rect x="${x - 24}" y="${groundY - 16}" width="48" height="5" rx="2" fill="#a8895f"/>
      </g>`;
  }
  const h = st === 2 ? 30 : 46;       // высота стен
  const w = st === 2 ? 44 : 56;
  const roofH = 22;
  const top = groundY - h;
  const decor = st >= 4 ? `
      <g class="bob"${sway}>
        <rect x="${x + w/2 - 2}" y="${top - roofH - 20}" width="2" height="20" fill="#7a6a55"/>
        <path d="M${x + w/2} ${top - roofH - 20} l16 5 -16 5 z" fill="${col}"/>
      </g>
      <circle cx="${x - w/2 - 10}" cy="${groundY - 10}" r="9" fill="#3f8a4f"/>
      <rect x="${x - w/2 - 11}" y="${groundY - 6}" width="2" height="7" fill="#6b4f2a"/>` : '';
  const window2 = st >= 3 ? `<rect x="${x + 4}" y="${top + 10}" width="12" height="12" rx="1.5" fill="#fff3c4" stroke="#caa24a"/>` : '';
  return `
    <g>
      <ellipse cx="${x}" cy="${groundY + 2}" rx="${w/2 + 8}" ry="8" fill="#000" opacity="0.10"/>
      <rect x="${x - w/2}" y="${top}" width="${w}" height="${h}" rx="2" fill="#fff" stroke="#e6ddcf"/>
      <rect x="${x - w/2}" y="${top}" width="${w}" height="${h}" rx="2" fill="${col}" opacity="0.10"/>
      <path d="M${x - w/2 - 6} ${top} L${x} ${top - roofH} L${x + w/2 + 6} ${top} Z" fill="${col}"/>
      <rect x="${x - 9}" y="${groundY - 20}" width="18" height="20" rx="2" fill="${col}" opacity="0.85"/>
      <circle cx="${x + 5}" cy="${groundY - 10}" r="1.6" fill="#fff"/>
      <rect x="${x - w/2 + 6}" y="${top + 10}" width="12" height="12" rx="1.5" fill="#fff3c4" stroke="#caa24a"/>
      ${window2}
      ${decor}
      <text x="${x}" y="${top - roofH + 14}" text-anchor="middle" font-size="13">${region.emoji}</text>
    </g>`;
}

// Главный экспорт: вернуть SVG-строку городка
// палитры тем (скины города из магазина)
const THEMES = {
  dia:       { sky: ['#cdeafe', '#eaf7ff'], hillA: '#a7d98b', hillB: '#7fc06a', hill2: '#6fb45c', orb: '#ffe08a', cloud: '#ffffff' },
  primavera: { sky: ['#d6f0ff', '#f3fbe7'], hillA: '#b7e08a', hillB: '#8ecb63', hill2: '#7cc257', orb: '#ffe89a', cloud: '#ffffff', flowers: true },
  atardecer: { sky: ['#ffcf9e', '#ffb0a6'], hillA: '#c2a169', hillB: '#9c7b4f', hill2: '#86683f', orb: '#ff7a4d', cloud: '#ffd9c2' },
  noche:     { sky: ['#1c2b4d', '#33406b'], hillA: '#2f5d3a', hillB: '#234a2e', hill2: '#1d3e27', orb: '#eef2f9', cloud: '#8fa0bd', night: true },
  nevado:    { sky: ['#dbeaf5', '#eef6fb'], hillA: '#eaf0f4', hillB: '#d2dde4', hill2: '#c2cfd7', orb: '#ffe08a', cloud: '#ffffff', snow: true },
};

export function townSVG(statsByRegion, themeKey = 'dia') {
  const W = 820, H = 360, groundY = 286;
  const T = THEMES[themeKey] || THEMES.dia;
  // расставляем регионы в 2 ряда (задний/передний) для глубины
  const back = [], front = [];
  REGIONS.forEach((r, i) => (i % 2 === 0 ? front : back).push(r));

  const place = (arr, baseY, scale, startX, gap) =>
    arr.map((r, i) => {
      const s = statsByRegion[r.id] || { mastered: 0, total: 0 };
      const st = stage(s.mastered, s.total);
      const x = startX + i * gap;
      const g = building(r, st, x, baseY, i);
      return scale === 1 ? g : `<g transform="translate(${x} ${baseY}) scale(${scale}) translate(${-x} ${-baseY})" opacity="0.92">${g}</g>`;
    }).join('');

  const backRow = place(back, groundY - 42, 0.82, 110, 150);
  const frontRow = place(front, groundY, 1, 70, 132);

  const stars = T.night
    ? `<g fill="#fff">${[[90,40],[160,80],[300,50],[430,90],[600,40],[660,100],[760,60],[230,120],[520,110]]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.6 : 2.4}" opacity="${0.5 + (i % 3) * 0.2}"/>`).join('')}</g>`
    : '';
  const clouds = T.night ? '' : `<g fill="${T.cloud}" opacity="0.9">
      <ellipse cx="180" cy="70" rx="34" ry="16"/><ellipse cx="210" cy="62" rx="26" ry="14"/>
      <ellipse cx="520" cy="48" rx="30" ry="14"/><ellipse cx="548" cy="56" rx="22" ry="11"/>
    </g>`;
  const snow = T.snow
    ? `<g fill="#ffffff">${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 97 + 30) % W}" cy="${(i * 53 + 20) % 240}" r="2.6" opacity="0.85"/>`).join('')}</g>`
    : '';
  const flowers = T.flowers
    ? `<g>${[[60,318],[150,330],[300,322],[470,332],[640,320],[740,330],[210,344],[560,344]]
        .map(([x, y], i) => `<g><rect x="${x}" y="${y}" width="2" height="8" fill="#3f8a4f"/><circle cx="${x + 1}" cy="${y}" r="3.4" fill="${['#e76f51','#f4a259','#e07aa8','#fff'][i % 4]}"/><circle cx="${x + 1}" cy="${y}" r="1.3" fill="#ffe08a"/></g>`).join('')}</g>`
    : '';

  return `
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="town-svg" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="sky-${themeKey}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${T.sky[0]}"/>
        <stop offset="1" stop-color="${T.sky[1]}"/>
      </linearGradient>
      <linearGradient id="hill-${themeKey}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${T.hillA}"/>
        <stop offset="1" stop-color="${T.hillB}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky-${themeKey})"/>
    ${stars}
    <circle cx="710" cy="64" r="34" fill="${T.orb}"/>
    <circle cx="710" cy="64" r="46" fill="${T.orb}" opacity="0.25"/>
    ${T.night ? '<circle cx="722" cy="58" r="30" fill="#1c2b4d" opacity="0.18"/>' : ''}
    ${clouds}
    <path d="M0 250 Q205 210 410 248 T820 244 V360 H0 Z" fill="url(#hill-${themeKey})"/>
    <path d="M0 300 Q205 270 410 300 T820 296 V360 H0 Z" fill="${T.hill2}"/>
    ${flowers}
    <g>${backRow}</g>
    <g>${frontRow}</g>
    ${snow}
  </svg>`;
}
