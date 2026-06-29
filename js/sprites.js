// ============================================================
//  Пиксельная отрисовка мира на canvas (вид сверху)
// ============================================================

const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h)); };

// ---------- земля ----------
export function drawGround(ctx, cam, vw, vh, T) {
  // базовая трава
  ctx.fillStyle = '#7cc257';
  ctx.fillRect(0, 0, vw, vh);
  // клетчатый оттенок травы
  const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T);
  for (let ty = y0 - 1; ty < y0 + vh / T + 1; ty++) {
    for (let tx = x0 - 1; tx < x0 + vw / T + 1; tx++) {
      if (((tx + ty) & 1) === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(tx * T - cam.x, ty * T - cam.y, T, T);
      }
    }
  }
}

// дорожки + площадь
export function drawPaths(ctx, cam, T, paths, plaza) {
  for (const p of paths) {
    rect(ctx, p.x * T - cam.x, p.y * T - cam.y, p.w * T, p.h * T, '#cdb892');
    rect(ctx, p.x * T - cam.x, p.y * T - cam.y, p.w * T, 2, '#bda579');
  }
}

// фонтан на площади
export function drawFountain(ctx, sx, sy, T) {
  rect(ctx, sx - T * 0.9, sy - T * 0.9, T * 1.8, T * 1.8, '#9aa6b2');
  rect(ctx, sx - T * 0.7, sy - T * 0.7, T * 1.4, T * 1.4, '#bcdfe8');
  rect(ctx, sx - T * 0.25, sy - T * 0.5, T * 0.5, T, '#9aa6b2');
  rect(ctx, sx - T * 0.16, sy - T * 0.7, T * 0.32, T * 0.4, '#cfeefa');
}

// ---------- здание ----------
export function drawBuilding(ctx, sx, sy, w, h, loc, T, glow) {
  const dark = shade(loc.color, -0.25);
  // тень
  rect(ctx, sx + 4, sy + h - 6, w, 10, 'rgba(0,0,0,0.12)');
  // стены
  rect(ctx, sx, sy + T * 0.7, w, h - T * 0.7, '#fbf3e6');
  rect(ctx, sx, sy + h - 8, w, 8, shade('#fbf3e6', -0.12));
  // крыша
  rect(ctx, sx - 4, sy, w + 8, T * 0.85, loc.color);
  rect(ctx, sx - 4, sy + T * 0.7, w + 8, 6, dark);
  // окна
  const wy = sy + T * 1.0;
  rect(ctx, sx + w * 0.16, wy, T * 0.55, T * 0.55, '#bfe6ef');
  rect(ctx, sx + w * 0.62, wy, T * 0.55, T * 0.55, '#bfe6ef');
  // дверь (по центру снизу)
  const dw = T * 0.7, dx = sx + w / 2 - dw / 2, dy = sy + h - T * 0.95;
  rect(ctx, dx, dy, dw, T * 0.95, dark);
  rect(ctx, dx + dw - 6, dy + T * 0.4, 4, 4, '#ffe08a');
  // вывеска с эмодзи
  ctx.font = `${Math.round(T * 0.7)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(loc.emoji, sx + w / 2, sy + T * 0.36);
  // подпись
  ctx.font = `bold ${Math.round(T * 0.34)}px -apple-system,system-ui,sans-serif`;
  const label = loc.name;
  const lw = ctx.measureText(label).width + 10;
  rect(ctx, sx + w / 2 - lw / 2, sy - T * 0.62, lw, T * 0.5, 'rgba(44,42,38,0.85)');
  ctx.fillStyle = '#fff';
  ctx.fillText(label, sx + w / 2, sy - T * 0.37);
}

// светящийся хот-спот у двери
export function drawHotspot(ctx, sx, sy, T, pulse) {
  const r = T * (0.5 + 0.12 * pulse);
  const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
  g.addColorStop(0, 'rgba(255,225,120,0.85)');
  g.addColorStop(1, 'rgba(255,225,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `${Math.round(T * 0.5)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('❗', sx, sy - T * 0.05);
}

// ---------- персонаж (вид сверху) ----------
export function drawPerson(ctx, sx, sy, T, look, phase, moving) {
  const skin = look.skin || '#f1c9a5';
  const shirt = look.shirt || '#e07aa8';
  const hair = look.hairColor || '#5a3b22';
  const u = T / 26; // единица масштаба
  const bob = moving ? Math.sin(phase) * 1.4 : 0;
  const yy = sy + bob;
  // тень
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 11 * u, 9 * u, 4 * u, 0, 0, 7); ctx.fill();
  const girl = look.gender !== 'm';
  // ноги (шагают)
  const step = moving ? Math.sin(phase) * 3 * u : 0;
  const legc = girl ? skin : '#46587f';
  rect(ctx, sx - 5 * u, yy + 6 * u + step, 4 * u, 6 * u, legc);
  rect(ctx, sx + 1 * u, yy + 6 * u - step, 4 * u, 6 * u, legc);
  // тело (рубашка/платье)
  if (girl) { ctx.fillStyle = shirt; ctx.beginPath(); ctx.moveTo(sx - 7 * u, yy - 2 * u); ctx.lineTo(sx + 7 * u, yy - 2 * u); ctx.lineTo(sx + 9 * u, yy + 9 * u); ctx.lineTo(sx - 9 * u, yy + 9 * u); ctx.closePath(); ctx.fill(); }
  else rect(ctx, sx - 6.5 * u, yy - 2 * u, 13 * u, 10 * u, shirt);
  rect(ctx, sx - 7 * u, yy - 2 * u, 14 * u, 2 * u, shade(shirt, 0.12));
  // голова
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(sx, yy - 6 * u, 6.2 * u, 0, 7); ctx.fill();
  // волосы (сверху/по бокам)
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(sx, yy - 8 * u, 6.4 * u, Math.PI, 0); ctx.fill();
  rect(ctx, sx - 6.4 * u, yy - 8 * u, 2.4 * u, 6 * u, hair);
  rect(ctx, sx + 4 * u, yy - 8 * u, 2.4 * u, 6 * u, hair);
  if (look.hairStyle === 'curly') {
    ctx.fillStyle = hair;
    for (const [dx, dy] of [[-6, -9], [-3, -11], [0, -11.5], [3, -11], [6, -9]]) {
      ctx.beginPath(); ctx.arc(sx + dx * u, yy + dy * u, 2.6 * u, 0, 7); ctx.fill();
    }
  } else if (look.hairStyle === 'ponytail') {
    rect(ctx, sx + 5 * u, yy - 9 * u, 3 * u, 9 * u, hair);
  }
  // глаза
  ctx.fillStyle = '#3a2a22';
  ctx.fillRect((sx - 3 * u) | 0, (yy - 6 * u) | 0, Math.ceil(1.6 * u), Math.ceil(1.6 * u));
  ctx.fillRect((sx + 1.4 * u) | 0, (yy - 6 * u) | 0, Math.ceil(1.6 * u), Math.ceil(1.6 * u));
  // шляпа
  drawHat(ctx, sx, yy - 10 * u, u, look.hat);
}

function drawHat(ctx, x, y, u, hat) {
  if (!hat || hat === 'none') return;
  if (hat === 'gorra') { rect(ctx, x - 6 * u, y, 12 * u, 3 * u, '#e76f51'); rect(ctx, x + 4 * u, y + 2 * u, 5 * u, 2 * u, '#c2563c'); }
  else if (hat === 'sombrero') { rect(ctx, x - 9 * u, y + 2 * u, 18 * u, 2 * u, '#e7c873'); rect(ctx, x - 5 * u, y - 2 * u, 10 * u, 4 * u, '#e7c873'); }
  else if (hat === 'boina') { rect(ctx, x - 6 * u, y, 12 * u, 3 * u, '#46587f'); }
  else if (hat === 'corona') { ctx.fillStyle = '#f4c430'; ctx.beginPath(); ctx.moveTo(x - 6 * u, y + 3 * u); ctx.lineTo(x - 6 * u, y - 1 * u); ctx.lineTo(x - 2 * u, y + 1 * u); ctx.lineTo(x, y - 3 * u); ctx.lineTo(x + 2 * u, y + 1 * u); ctx.lineTo(x + 6 * u, y - 1 * u); ctx.lineTo(x + 6 * u, y + 3 * u); ctx.fill(); }
  else if (hat === 'lazo') { ctx.fillStyle = '#e23a6e'; rect(ctx, x - 5 * u, y, 4 * u, 4 * u, '#e23a6e'); rect(ctx, x + 1 * u, y, 4 * u, 4 * u, '#e23a6e'); rect(ctx, x - 1 * u, y + 1 * u, 2 * u, 2 * u, '#c22a58'); }
  else if (hat === 'flor') { ctx.fillStyle = '#f15b9a'; ctx.beginPath(); ctx.arc(x + 5 * u, y + 1 * u, 2.4 * u, 0, 7); ctx.fill(); }
}

// ---------- NPC ----------
export function drawNPC(ctx, sx, sy, T, pal, phase) {
  const u = T / 26;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 11 * u, 8 * u, 4 * u, 0, 0, 7); ctx.fill();
  const sway = Math.sin(phase) * 1.5 * u;
  rect(ctx, sx - 6 * u, sy - 1 * u + sway * 0, 12 * u, 9 * u, pal.shirt);
  ctx.fillStyle = pal.skin; ctx.beginPath(); ctx.arc(sx, sy - 6 * u, 5.6 * u, 0, 7); ctx.fill();
  ctx.fillStyle = pal.hair;
  ctx.beginPath(); ctx.arc(sx, sy - 8 * u, 5.8 * u, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#3a2a22';
  ctx.fillRect((sx - 2.6 * u) | 0, (sy - 6 * u) | 0, Math.ceil(1.4 * u), Math.ceil(1.4 * u));
  ctx.fillRect((sx + 1.2 * u) | 0, (sy - 6 * u) | 0, Math.ceil(1.4 * u), Math.ceil(1.4 * u));
  // значок «поговорить»
  ctx.font = `${Math.round(T * 0.42)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💬', sx, sy - 13 * u - (1 + Math.sin(phase)) * 1.5 * u);
}

// ---------- дерево / куст ----------
export function drawTree(ctx, sx, sy, T) {
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(sx, sy + T * 0.4, T * 0.4, T * 0.16, 0, 0, 7); ctx.fill();
  rect(ctx, sx - T * 0.07, sy, T * 0.14, T * 0.45, '#6b4f2a');
  ctx.fillStyle = '#3f8a4f'; ctx.beginPath(); ctx.arc(sx, sy - T * 0.15, T * 0.42, 0, 7); ctx.fill();
  ctx.fillStyle = '#4fa05c'; ctx.beginPath(); ctx.arc(sx - T * 0.18, sy - T * 0.28, T * 0.22, 0, 7); ctx.fill();
}

// ---------- сундук ----------
export function drawChest(ctx, sx, sy, T, open, pulse) {
  const w = T * 0.66, h = T * 0.5;
  // свечение у закрытого
  if (!open) {
    const r = T * (0.55 + 0.12 * pulse);
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
    g.addColorStop(0, 'rgba(255,225,120,0.7)'); g.addColorStop(1, 'rgba(255,225,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(sx, sy + h * 0.55, w * 0.6, 4, 0, 0, 7); ctx.fill();
  const body = open ? '#8a7d6a' : '#9a6b3a';
  const lid = open ? '#a99a86' : '#b5824a';
  rect(ctx, sx - w / 2, sy - h * 0.1, w, h * 0.6, body);            // низ
  rect(ctx, sx - w / 2, sy - h * 0.5, w, h * 0.45, lid);           // крышка
  rect(ctx, sx - w / 2, sy - h * 0.12, w, 3, '#6b4a26');           // обод
  if (!open) { rect(ctx, sx - 3, sy - h * 0.18, 6, 8, '#f4c430'); rect(ctx, sx - 4, sy - h * 0.5, 8, 3, '#f4c430'); }
  else { ctx.fillStyle = '#6b6256'; ctx.font = `${Math.round(T * 0.3)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; }
}

export function drawBush(ctx, sx, sy, T) {
  ctx.fillStyle = '#479a52'; ctx.beginPath(); ctx.arc(sx, sy, T * 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#56ad60'; ctx.beginPath(); ctx.arc(sx - T * 0.12, sy - T * 0.08, T * 0.16, 0, 7); ctx.fill();
}

// ---------- утилита затемнения цвета ----------
function shade(hex, amt) {
  const c = hex.replace('#', '');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
  return `rgb(${r},${g},${b})`;
}
