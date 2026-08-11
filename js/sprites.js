// ============================================================
//  Улучшенная отрисовка мира на canvas
// ============================================================

// Скруглённый прямоугольник — полифил для старых браузеров
function rr(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = [r, r, r, r];
  const [tl, tr, br, bl] = r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

function fillRR(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, r);
  ctx.fill();
}

// мягкая «размытая» тень — радиальный градиент вместо плоского эллипса
function softShadow(ctx, sx, sy, rx, ry, alpha) {
  if (alpha === undefined) alpha = 0.22;
  ctx.save();
  ctx.translate(sx, sy); ctx.scale(1, ry / rx); ctx.translate(-sx, -sy);
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rx);
  g.addColorStop(0, `rgba(15,15,10,${alpha})`);
  g.addColorStop(0.65, `rgba(15,15,10,${alpha * 0.55})`);
  g.addColorStop(1, 'rgba(15,15,10,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, rx, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// тонкий блик-обводка по верхнему краю формы — премиальный rim-light приём
function rimLight(ctx, drawPath, alpha) {
  ctx.save();
  ctx.strokeStyle = `rgba(255,255,255,${alpha === undefined ? 0.22 : alpha})`;
  ctx.lineWidth = 1;
  drawPath();
  ctx.stroke();
  ctx.restore();
}

// детерминированный псевдослучайный хэш по тайлу — чтобы текстура травы не мерцала между кадрами
function tileHash(tx, ty, salt) {
  let h = (tx * 374761393 + ty * 668265263 + salt * 97531) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------- земля ----------
export function drawGround(ctx, cam, vw, vh, T) {
  const grad = ctx.createLinearGradient(0, 0, 0, vh);
  grad.addColorStop(0, '#6db84d');
  grad.addColorStop(1, '#82c460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, vw, vh);
  const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T);
  for (let ty = y0 - 1; ty < y0 + vh / T + 1; ty++) {
    for (let tx = x0 - 1; tx < x0 + vw / T + 1; tx++) {
      const px = tx * T - cam.x, py = ty * T - cam.y;
      if (((tx + ty) & 1) === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(px, py, T, T);
      }
      // лёгкая вариация тона тайла — убирает однородность газона
      const shade = tileHash(tx, ty, 1);
      ctx.fillStyle = shade > 0.72 ? 'rgba(30,70,20,0.05)' : shade < 0.16 ? 'rgba(255,255,255,0.05)' : 'transparent';
      if (shade > 0.72 || shade < 0.16) ctx.fillRect(px, py, T, T);
      // травинки-пучки — 0-2 на тайл, позиция и наклон детерминированы
      const tuftN = tileHash(tx, ty, 2) > 0.55 ? (tileHash(tx, ty, 3) > 0.8 ? 2 : 1) : 0;
      for (let i = 0; i < tuftN; i++) {
        const fx = px + 6 + tileHash(tx, ty, 10 + i) * (T - 12);
        const fy = py + 8 + tileHash(tx, ty, 20 + i) * (T - 14);
        const lean = (tileHash(tx, ty, 30 + i) - 0.5) * 3;
        const bh = T * (0.1 + tileHash(tx, ty, 40 + i) * 0.06);
        ctx.strokeStyle = 'rgba(40,95,35,0.35)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        for (const dx of [-2, 0, 2]) {
          ctx.beginPath(); ctx.moveTo(fx + dx, fy); ctx.lineTo(fx + dx + lean, fy - bh); ctx.stroke();
        }
      }
      // редкие полевые цветочки
      if (tileHash(tx, ty, 5) > 0.93) {
        const fx = px + 6 + tileHash(tx, ty, 6) * (T - 12);
        const fy = py + 6 + tileHash(tx, ty, 7) * (T - 12);
        const hue = tileHash(tx, ty, 8) > 0.5 ? '#fff6b8' : '#ffd6ec';
        ctx.fillStyle = hue;
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2;
          ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 2.2, 1.6, 1.1, a, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#f4c430';
        ctx.beginPath(); ctx.arc(fx, fy, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

// дорожки
export function drawPaths(ctx, cam, T, paths) {
  for (const p of paths) {
    const px = p.x * T - cam.x, py = p.y * T - cam.y;
    ctx.fillStyle = '#d4c4a0';
    ctx.fillRect(px, py, p.w * T, p.h * T);
    ctx.fillStyle = '#c2ad88';
    ctx.fillRect(px, py, p.w * T, 1.5);
    ctx.fillRect(px, py + p.h * T - 1.5, p.w * T, 1.5);
    // плиточный узор
    ctx.strokeStyle = 'rgba(180,160,120,0.3)';
    ctx.lineWidth = 0.5;
    const ts = T * 0.6;
    for (let i = 0; i < p.w * T; i += ts) {
      ctx.beginPath(); ctx.moveTo(px + i, py); ctx.lineTo(px + i, py + p.h * T); ctx.stroke();
    }
  }
}

// фонтан
export function drawFountain(ctx, sx, sy, T) {
  softShadow(ctx, sx + 3, sy + 5, T * 1.1, T * 0.6, 0.24);
  // внешний бортик — камень с градиентом и объёмом
  const rimG = ctx.createRadialGradient(sx - T * 0.3, sy - T * 0.3, T * 0.2, sx, sy, T * 1.1);
  rimG.addColorStop(0, '#b6c4d2'); rimG.addColorStop(0.7, '#8a9db0'); rimG.addColorStop(1, '#6f8296');
  ctx.fillStyle = rimG;
  ctx.beginPath(); ctx.ellipse(sx, sy, T * 1.05, T * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(sx, sy - T * 0.02, T * 1.03, T * 0.6, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  // внутренний бортик (глубина чаши)
  ctx.fillStyle = shade('#8a9db0', -0.22);
  ctx.beginPath(); ctx.ellipse(sx, sy + T * 0.03, T * 0.86, T * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  // вода с многоступенчатым градиентом
  const wg = ctx.createRadialGradient(sx - T * 0.2, sy - T * 0.1, 0, sx, sy, T * 0.85);
  wg.addColorStop(0, '#d4f4ff'); wg.addColorStop(0.45, '#a8e4f6'); wg.addColorStop(1, '#5fa8c8');
  ctx.fillStyle = wg;
  ctx.beginPath(); ctx.ellipse(sx, sy, T * 0.82, T * 0.48, 0, 0, Math.PI * 2); ctx.fill();
  // рябь — тонкие концентрические кольца
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  for (const rr2 of [0.35, 0.58]) {
    ctx.beginPath(); ctx.ellipse(sx, sy, T * 0.82 * rr2, T * 0.48 * rr2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // блик на воде
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.ellipse(sx - T * 0.28, sy - T * 0.15, T * 0.22, T * 0.1, -0.3, 0, Math.PI * 2); ctx.fill();
  // центральный столб с бликом
  const pg = ctx.createLinearGradient(sx - T * 0.1, 0, sx + T * 0.1, 0);
  pg.addColorStop(0, '#7c8b98'); pg.addColorStop(0.5, '#b8c6d2'); pg.addColorStop(1, '#7c8b98');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.ellipse(sx, sy, T * 0.1, T * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  // струи воды
  ctx.strokeStyle = 'rgba(210,245,255,0.85)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + Math.cos(a) * T * 0.32, sy + Math.sin(a) * T * 0.18 - T * 0.2, sx + Math.cos(a) * T * 0.46, sy + Math.sin(a) * T * 0.26);
    ctx.stroke();
  }
  // мелкие искрящиеся капли-блики
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    ctx.beginPath(); ctx.arc(sx + Math.cos(a) * T * 0.4, sy + Math.sin(a) * T * 0.22 - T * 0.15, T * 0.02, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- здание ----------
export function drawBuilding(ctx, sx, sy, w, h, loc, T, glow) {
  const dark = shade(loc.color, -0.28);
  const light = shade(loc.color, 0.18);

  // мягкая тень под зданием
  softShadow(ctx, sx + w / 2, sy + h + 4, w / 1.7, 9, 0.2);

  // стены с лёгким градиентом
  const wallG = ctx.createLinearGradient(sx, 0, sx + w, 0);
  wallG.addColorStop(0, '#ede5d8');
  wallG.addColorStop(0.45, '#fdf6ee');
  wallG.addColorStop(1, '#e8e0d2');
  ctx.fillStyle = wallG;
  rr(ctx, sx, sy + T * 0.65, w, h - T * 0.65, [0, 0, 4, 4]); ctx.fill();

  // горизонтальная обшивка стен — тонкие линии для фактуры
  ctx.save();
  rr(ctx, sx, sy + T * 0.65, w, h - T * 0.65, [0, 0, 4, 4]); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 1;
  for (let ly = sy + T * 0.65 + 8; ly < sy + h; ly += 8) {
    ctx.beginPath(); ctx.moveTo(sx, ly); ctx.lineTo(sx + w, ly); ctx.stroke();
  }
  // мягкая тень (AO) в стыке стены с крышей
  const wallAO = ctx.createLinearGradient(0, sy + T * 0.65, 0, sy + T * 0.65 + 10);
  wallAO.addColorStop(0, 'rgba(60,40,20,0.14)'); wallAO.addColorStop(1, 'rgba(60,40,20,0)');
  ctx.fillStyle = wallAO;
  ctx.fillRect(sx, sy + T * 0.65, w, 10);
  ctx.restore();

  // нижний плинтус
  ctx.fillStyle = shade('#fbf3e6', -0.1);
  rr(ctx, sx, sy + h - 9, w, 9, [0, 0, 4, 4]); ctx.fill();

  // крыша с градиентом
  const roofG = ctx.createLinearGradient(sx, sy, sx, sy + T * 0.8);
  roofG.addColorStop(0, light); roofG.addColorStop(1, loc.color);
  ctx.fillStyle = roofG;
  rr(ctx, sx - 4, sy, w + 8, T * 0.82, [5, 5, 0, 0]); ctx.fill();
  // черепица — диагональная штриховка поверх крыши
  ctx.save();
  rr(ctx, sx - 4, sy, w + 8, T * 0.82, [5, 5, 0, 0]); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1;
  for (let lx = sx - w; lx < sx + w + 8; lx += 7) {
    ctx.beginPath(); ctx.moveTo(lx, sy); ctx.lineTo(lx + T * 0.5, sy + T * 0.82); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.moveTo(sx - 4, sy + 2); ctx.lineTo(sx + w + 4, sy + 2); ctx.stroke();
  ctx.restore();
  // карниз под крышей
  ctx.fillStyle = dark;
  ctx.fillRect(sx - 4, sy + T * 0.7, w + 8, 5);

  // окна + цветочные ящики под ними
  drawWindow(ctx, sx + w * 0.13, sy + T * 1.0, T * 0.52, T * 0.54);
  drawWindow(ctx, sx + w * 0.6,  sy + T * 1.0, T * 0.52, T * 0.54);
  drawFlowerBox(ctx, sx + w * 0.13 - 2, sy + T * 1.0 + T * 0.54 + 2, T * 0.56);
  drawFlowerBox(ctx, sx + w * 0.6 - 2,  sy + T * 1.0 + T * 0.54 + 2, T * 0.56);

  // ступенька
  const dw = T * 0.74, dx = sx + w / 2 - dw / 2;
  ctx.fillStyle = shade('#fbf3e6', -0.18);
  rr(ctx, dx - 5, sy + h - 5, dw + 10, 5, 2); ctx.fill();

  // тент-маркиза над дверью
  const awnY = sy + h - T * 1.12;
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(dx - 6, awnY + 10); ctx.lineTo(dx + dw + 6, awnY + 10);
  ctx.lineTo(dx + dw + 2, awnY); ctx.lineTo(dx - 2, awnY);
  ctx.closePath(); ctx.fill();
  const stripes = 5, stripeW = (dw + 8) / stripes;
  for (let i = 0; i < stripes; i += 2) {
    ctx.fillStyle = shade(loc.color, 0.1);
    ctx.beginPath();
    const x0 = dx - 4 + i * stripeW, x1 = dx - 4 + (i + 1) * stripeW;
    ctx.moveTo(x0, awnY + 10); ctx.lineTo(x1, awnY + 10);
    ctx.lineTo(x1 - 3, awnY); ctx.lineTo(x0 - 3, awnY);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = dark;
  for (let i = 0; i < stripes + 1; i++) {
    const x = dx - 5 + i * stripeW;
    ctx.beginPath(); ctx.moveTo(x, awnY + 10); ctx.lineTo(x + 2, awnY + 15); ctx.lineTo(x - 2, awnY + 15); ctx.closePath(); ctx.fill();
  }

  // дверь с деревянным градиентом и филёнками
  const doorG = ctx.createLinearGradient(dx, 0, dx + dw, 0);
  doorG.addColorStop(0, shade(dark, -0.08)); doorG.addColorStop(0.5, shade(dark, 0.1)); doorG.addColorStop(1, shade(dark, -0.08));
  ctx.fillStyle = doorG;
  rr(ctx, dx, sy + h - T * 0.98, dw, T * 0.98, [3, 3, 0, 0]); ctx.fill();
  // филёнки (панели)
  ctx.strokeStyle = shade(dark, -0.2); ctx.lineWidth = 1.4;
  rr(ctx, dx + dw * 0.15, sy + h - T * 0.86, dw * 0.7, T * 0.34, 2); ctx.stroke();
  rr(ctx, dx + dw * 0.15, sy + h - T * 0.44, dw * 0.7, T * 0.34, 2); ctx.stroke();
  // блик на двери
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(dx + 3, sy + h - T * 0.95, dw / 2.2 - 2, T * 0.4);
  // ручка с бликом
  ctx.fillStyle = '#c9932e';
  ctx.beginPath(); ctx.arc(dx + dw - 8, sy + h - T * 0.48, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath(); ctx.arc(dx + dw - 8.8, sy + h - T * 0.48 - 0.6, 1.1, 0, Math.PI * 2); ctx.fill();

  // эмодзи
  ctx.font = `${Math.round(T * 0.7)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(loc.emoji, sx + w / 2, sy + T * 0.37);

  // подпись
  ctx.font = `bold ${Math.round(T * 0.32)}px -apple-system,system-ui,sans-serif`;
  const lw = ctx.measureText(loc.name).width + 12;
  fillRR(ctx, sx + w / 2 - lw / 2, sy - T * 0.62, lw, T * 0.48, 4, 'rgba(30,28,24,0.84)');
  ctx.fillStyle = '#fff';
  ctx.fillText(loc.name, sx + w / 2, sy - T * 0.37);
}

function drawWindow(ctx, x, y, w, h) {
  // внешняя рамка с объёмом
  const frameG = ctx.createLinearGradient(x, y, x + w, y + h);
  frameG.addColorStop(0, shade('#7aa0b8', 0.15)); frameG.addColorStop(1, shade('#7aa0b8', -0.15));
  ctx.fillStyle = frameG;
  rr(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 3); ctx.fill();
  // стекло — небо + мягкое отражение
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#dff3fa'); g.addColorStop(0.55, '#b8e2f0'); g.addColorStop(1, '#8fc8e0');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 2); ctx.fill();
  // перекладина
  ctx.strokeStyle = '#7aa0b8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  // диагональный блик-отражение
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h * 0.1); ctx.lineTo(x + w * 0.42, y + 2); ctx.lineTo(x + w * 0.2, y + h * 0.55); ctx.lineTo(x + 2, y + h * 0.4);
  ctx.closePath(); ctx.fill();
}

// цветочный ящик под окном — премиальная деталь фасада
function drawFlowerBox(ctx, x, y, w) {
  const h = w * 0.24;
  const boxG = ctx.createLinearGradient(x, y, x, y + h);
  boxG.addColorStop(0, '#a9743f'); boxG.addColorStop(1, '#8a5a2e');
  ctx.fillStyle = boxG;
  rr(ctx, x, y, w, h, 1.5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.7;
  for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + (w / 3) * i, y); ctx.lineTo(x + (w / 3) * i, y + h); ctx.stroke(); }
  // цветы
  const colors = ['#ff6b9d', '#ffd166', '#ff9a6b'];
  for (let i = 0; i < 5; i++) {
    const fx = x + w * (0.12 + i * 0.19), fy = y - h * 0.32;
    ctx.fillStyle = '#5fa85f';
    ctx.beginPath(); ctx.ellipse(fx, fy + 2, 1.4, 2.4, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors[i % colors.length];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 1.6, fy + Math.sin(a) * 1.6, 1.3, 0.8, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath(); ctx.arc(fx, fy, 0.9, 0, Math.PI * 2); ctx.fill();
  }
}

// светящийся хот-спот у двери
export function drawHotspot(ctx, sx, sy, T, pulse) {
  const r = T * (0.5 + 0.12 * pulse);
  const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
  g.addColorStop(0, 'rgba(255,225,120,0.85)');
  g.addColorStop(1, 'rgba(255,225,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `${Math.round(T * 0.5)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('❗', sx, sy - T * 0.05);
}

// ---------- транспорт (рисуется ДО персонажа) ----------
function drawVehicle(ctx, sx, sy, T, vehicle, phase) {
  if (!vehicle || vehicle === 'none') return;
  const u = T / 26;
  const spin = phase * 4;
  ctx.save();

  if (vehicle === 'skateboard') {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 12.5 * u, 8 * u, 2 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8903a';
    rr(ctx, sx - 8 * u, sy + 9 * u, 16 * u, 3 * u, 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    rr(ctx, sx - 7.5 * u, sy + 9 * u, 15 * u, 1.2 * u, 1); ctx.fill();
    for (const wx of [-5.5, 5.5]) {
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(sx + wx * u, sy + 12.5 * u, 1.8 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(sx + wx * u, sy + 12.5 * u, 0.7 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (vehicle === 'bike') {
    const wr = 5.5 * u;
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 14 * u, 11 * u, 2.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.arc(sx - 8 * u, sy + 8 * u, wr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx + 8 * u, sy + 8 * u, wr, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 0.7 * u;
    for (const cx2 of [-8, 8]) {
      for (let s = 0; s < 4; s++) {
        const a = spin + s * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(sx + cx2 * u, sy + 8 * u);
        ctx.lineTo(sx + cx2 * u + Math.cos(a) * wr * 0.85, sy + 8 * u + Math.sin(a) * wr * 0.85); ctx.stroke();
      }
    }
    ctx.strokeStyle = '#e63946'; ctx.lineWidth = 1.6 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx - 8 * u, sy + 8 * u); ctx.lineTo(sx - 1 * u, sy + 2 * u); ctx.lineTo(sx + 8 * u, sy + 8 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 1 * u, sy + 2 * u); ctx.lineTo(sx + 5 * u, sy + 3 * u); ctx.stroke();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2 * u;
    ctx.beginPath(); ctx.moveTo(sx + 5 * u, sy + 1 * u); ctx.lineTo(sx + 8 * u, sy + 3 * u); ctx.stroke();
    ctx.fillStyle = '#222'; rr(ctx, sx - 3 * u, sy + 1 * u, 5 * u, 1.5 * u, 1); ctx.fill();
  } else if (vehicle === 'scooter') {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 14 * u, 8 * u, 2 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e63946'; rr(ctx, sx - 4 * u, sy + 3 * u, 8 * u, 6 * u, 3); ctx.fill();
    ctx.fillStyle = '#aaa'; ctx.fillRect(sx - 0.8 * u, sy - 2 * u, 1.6 * u, 6 * u);
    ctx.fillRect(sx - 5 * u, sy - 2.5 * u, 10 * u, 1.5 * u);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.arc(sx + 4 * u, sy + 11 * u, 3.5 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx - 4 * u, sy + 11 * u, 2.5 * u, 0, Math.PI * 2); ctx.stroke();
  } else if (vehicle === 'horse') {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 13 * u, 11 * u, 3 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B5A2B';
    ctx.beginPath(); ctx.ellipse(sx, sy + 6 * u, 10 * u, 5.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 9 * u, sy + 1 * u, 3 * u, 4 * u, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3010';
    ctx.beginPath(); ctx.ellipse(sx + 5 * u, sy - 1 * u, 1.5 * u, 4 * u, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(sx + 9.5 * u, sy - 0.5 * u, 0.8 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a3a12';
    const lp = Math.sin(phase) * 2 * u;
    for (const [lx, s] of [[-5, 1], [-2, -1], [2, -1], [5, 1]]) {
      ctx.fillRect(sx + lx * u - 1.2 * u, sy + 10 * u + s * lp, 2.4 * u, 4 * u);
    }
    ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 2 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx - 9 * u, sy + 4 * u);
    ctx.quadraticCurveTo(sx - 13 * u, sy + 8 * u, sx - 11 * u, sy + 12 * u); ctx.stroke();
  } else if (vehicle === 'moto') {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 14 * u, 13 * u, 3 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.2 * u;
    ctx.beginPath(); ctx.arc(sx - 10 * u, sy + 7 * u, 6.5 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx + 10 * u, sy + 7 * u, 6.5 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c0392b'; rr(ctx, sx - 8 * u, sy - 2 * u, 16 * u, 9 * u, 3); ctx.fill();
    ctx.fillStyle = '#e74c3c'; rr(ctx, sx - 7 * u, sy - 1 * u, 14 * u, 5 * u, 2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(sx + 6 * u, sy + 5 * u); ctx.lineTo(sx + 11 * u, sy + 5 * u); ctx.lineTo(sx + 11.5 * u, sy + 8 * u); ctx.stroke();
    ctx.fillStyle = '#555'; ctx.fillRect(sx - 2 * u, sy - 4 * u, 4 * u, 3 * u);
    ctx.fillRect(sx - 7 * u, sy - 4 * u, 14 * u, 1.5 * u);
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(sx + 10 * u, sy + 0 * u, 1.5 * u, 0, Math.PI * 2); ctx.fill();
  } else if (vehicle === 'car') {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 16 * u, 15 * u, 3.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2980b9'; rr(ctx, sx - 14 * u, sy + 1 * u, 28 * u, 10 * u, 5); ctx.fill();
    ctx.fillStyle = '#1a5276'; rr(ctx, sx - 9 * u, sy - 5 * u, 18 * u, 7 * u, 4); ctx.fill();
    ctx.fillStyle = 'rgba(180,220,255,0.7)'; rr(ctx, sx - 7 * u, sy - 4 * u, 14 * u, 5 * u, 2); ctx.fill();
    for (const [wx, wy] of [[-9, 11], [9, 11]]) {
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(sx + wx * u, sy + wy * u, 4 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(sx + wx * u, sy + wy * u, 1.8 * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.ellipse(sx + 13 * u, sy + 3 * u, 1.8 * u, 1.2 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx - 13 * u, sy + 3 * u, 1.8 * u, 1.2 * u, 0, 0, Math.PI * 2); ctx.fill();
  } else if (vehicle === 'heli') {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 17 * u, 14 * u, 3.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1.2 * u;
    ctx.beginPath(); ctx.moveTo(sx - 10 * u, sy + 11 * u); ctx.lineTo(sx + 10 * u, sy + 11 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 3 * u, sy + 9 * u); ctx.lineTo(sx - 3 * u, sy + 11 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 3 * u, sy + 9 * u); ctx.lineTo(sx + 3 * u, sy + 11 * u); ctx.stroke();
    ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.ellipse(sx, sy + 4 * u, 9 * u, 6 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(150,220,255,0.75)'; ctx.beginPath(); ctx.ellipse(sx + 4 * u, sy + 3 * u, 5 * u, 4.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e67e22';
    ctx.beginPath(); ctx.moveTo(sx - 7 * u, sy + 3 * u); ctx.lineTo(sx - 17 * u, sy + 4 * u); ctx.lineTo(sx - 17 * u, sy + 7 * u); ctx.lineTo(sx - 7 * u, sy + 8 * u); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(100,100,100,0.75)'; ctx.lineWidth = 0.8 * u;
    for (let i = 0; i < 3; i++) {
      const a = spin * 0.8 + i * Math.PI * 2 / 3;
      ctx.beginPath(); ctx.moveTo(sx - 17 * u, sy + 5.5 * u);
      ctx.lineTo(sx - 17 * u + Math.cos(a) * 3.5 * u, sy + 5.5 * u + Math.sin(a) * 3.5 * u); ctx.stroke();
    }
    ctx.lineWidth = 1.3 * u;
    for (let i = 0; i < 3; i++) {
      const a = spin * 1.5 + i * Math.PI * 2 / 3;
      ctx.beginPath(); ctx.moveTo(sx, sy - 6 * u);
      ctx.lineTo(sx + Math.cos(a) * 14 * u, sy - 6 * u + Math.sin(a) * 5 * u); ctx.stroke();
    }
  } else if (vehicle === 'yacht') {
    ctx.fillStyle = 'rgba(0,100,200,0.12)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 14 * u, 15 * u, 4 * u, 0, 0, Math.PI * 2); ctx.fill();
    const hg = ctx.createLinearGradient(sx - 13 * u, 0, sx + 13 * u, 0);
    hg.addColorStop(0, '#f0f0f0'); hg.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(sx - 13 * u, sy + 8 * u); ctx.lineTo(sx + 13 * u, sy + 8 * u);
    ctx.lineTo(sx + 10 * u, sy + 14 * u); ctx.lineTo(sx - 10 * u, sy + 14 * u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2980b9'; ctx.fillRect(sx - 13 * u, sy + 8 * u, 26 * u, 2 * u);
    ctx.fillStyle = '#c8a060'; rr(ctx, sx - 12 * u, sy + 4 * u, 24 * u, 5 * u, 2); ctx.fill();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(sx - 2 * u, sy + 4 * u); ctx.lineTo(sx - 2 * u, sy - 15 * u); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.moveTo(sx - 2 * u, sy - 15 * u); ctx.lineTo(sx + 12 * u, sy - 3 * u); ctx.lineTo(sx - 2 * u, sy + 2 * u); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.6 * u; ctx.stroke();
  }
  ctx.restore();
}

// ---------- персонаж ----------
export function drawPerson(ctx, sx, sy, T, look, phase, moving) {
  const skin  = look.skin      || '#f1c9a5';
  const shirt = look.shirt     || '#e07aa8';
  const hair  = look.hairColor || '#5a3b22';
  const u     = T / 26;
  const veh   = look.vehicle;

  // на некоторых транспортных средствах персонаж сидит выше
  const vehLift = (veh === 'horse') ? -4 * u : (veh === 'moto' || veh === 'bike' || veh === 'scooter') ? -2 * u : (veh === 'car') ? -3 * u : (veh === 'yacht') ? -2 * u : (veh === 'heli') ? -5 * u : 0;
  const bob   = moving && !veh ? Math.sin(phase) * 1.4 : (veh === 'horse' ? Math.sin(phase * 3) * 1.2 : 0);
  const yy    = sy + bob + vehLift;
  const girl  = look.gender !== 'm';

  // тень (только без транспорта или для скейтборда)
  if (!veh || veh === 'none' || veh === 'skateboard') {
    softShadow(ctx, sx, sy + 11 * u, 9 * u, 4 * u, 0.22);
  }

  // ноги — скрываем если в закрытом транспорте
  const hiddenLegs = veh && veh !== 'none' && veh !== 'skateboard' && veh !== 'bike';
  const onBoard = veh === 'skateboard';
  const step = (!hiddenLegs && !onBoard && moving) ? Math.sin(phase) * 3 * u : 0;
  // на скейте — статичная стойка (одна нога впереди, одна сзади), без бега
  const boardOffX = onBoard ? 2 * u : 0;
  const boardOffY = onBoard ? 1.5 * u : 0;
  if (!hiddenLegs) {
    const legColor = girl ? shade(skin, -0.14) : '#3a4e72';
    const shoeColor = girl ? '#c0507a' : '#2a3a58';
    for (const side of [-1, 1]) {
      const lx = sx + side * 3.6 * u - boardOffX * (side < 0 ? 1 : -1);
      const ly = yy + 6 * u + side * -step + boardOffY;
      const lg = ctx.createLinearGradient(lx - 2 * u, 0, lx + 2 * u, 0);
      lg.addColorStop(0, shade(legColor, -0.08)); lg.addColorStop(0.5, shade(legColor, 0.06)); lg.addColorStop(1, shade(legColor, -0.08));
      ctx.fillStyle = lg;
      rr(ctx, lx - 1.9 * u, ly, 3.8 * u, 5.5 * u, 2); ctx.fill();
      const sg2 = ctx.createLinearGradient(lx - 2.5 * u, 0, lx + 2.5 * u, 0);
      sg2.addColorStop(0, shade(shoeColor, -0.1)); sg2.addColorStop(0.5, shade(shoeColor, 0.14)); sg2.addColorStop(1, shade(shoeColor, -0.1));
      ctx.fillStyle = sg2;
      rr(ctx, lx - 2.5 * u, ly + 4.8 * u, 5 * u, 2.2 * u, 1); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(lx - 0.8 * u, ly + 5.4 * u, 1 * u, 0.4 * u, -0.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // тело
  if (girl) {
    // платье — трапеция с цилиндрическим градиентом (объём)
    const dressG = ctx.createLinearGradient(sx - 8.8 * u, 0, sx + 8.8 * u, 0);
    dressG.addColorStop(0, shade(shirt, -0.16));
    dressG.addColorStop(0.42, shade(shirt, 0.1));
    dressG.addColorStop(0.58, shade(shirt, 0.1));
    dressG.addColorStop(1, shade(shirt, -0.16));
    ctx.fillStyle = dressG;
    ctx.beginPath();
    ctx.moveTo(sx - 6.5 * u, yy - 2 * u);
    ctx.lineTo(sx + 6.5 * u, yy - 2 * u);
    ctx.lineTo(sx + 8.8 * u, yy + 9.5 * u);
    ctx.lineTo(sx - 8.8 * u, yy + 9.5 * u);
    ctx.closePath(); ctx.fill();
    // складки — мягкая мультиплай-тень вместо плоской линии
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = 'rgba(140,110,120,0.28)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx - 2.5 * u, yy + 0.5 * u); ctx.quadraticCurveTo(sx - 3.8 * u, yy + 5 * u, sx - 4.5 * u, yy + 9.3 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 2.5 * u, yy + 0.5 * u); ctx.quadraticCurveTo(sx + 3.8 * u, yy + 5 * u, sx + 4.5 * u, yy + 9.3 * u); ctx.stroke();
    ctx.restore();
    // мягкий блик по центру платья
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath(); ctx.ellipse(sx - 1.6 * u, yy + 3 * u, 1.4 * u, 5 * u, 0.05, 0, Math.PI * 2); ctx.fill();
    // подол — тонкая окантовка
    ctx.strokeStyle = shade(shirt, -0.22); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx - 8.8 * u, yy + 9.3 * u); ctx.lineTo(sx + 8.8 * u, yy + 9.3 * u); ctx.stroke();
  } else {
    // рубашка мужская
    const sg = ctx.createLinearGradient(sx - 7 * u, 0, sx + 7 * u, 0);
    sg.addColorStop(0, shade(shirt, -0.14)); sg.addColorStop(0.45, shade(shirt, 0.08)); sg.addColorStop(0.55, shade(shirt, 0.08)); sg.addColorStop(1, shade(shirt, -0.14));
    ctx.fillStyle = sg;
    rr(ctx, sx - 7 * u, yy - 2 * u, 14 * u, 10 * u, 2); ctx.fill();
    // воротник/планка
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(120,100,90,0.22)';
    ctx.beginPath(); ctx.moveTo(sx - 1.6 * u, yy - 2 * u); ctx.lineTo(sx, yy + 0.6 * u); ctx.lineTo(sx + 1.6 * u, yy - 2 * u); ctx.closePath(); ctx.fill();
    ctx.fillRect(sx - 0.4 * u, yy - 1.6 * u, 0.8 * u, 9.6 * u);
    ctx.restore();
    // пуговицы с объёмом
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = shade(shirt, -0.3);
      ctx.beginPath(); ctx.arc(sx, yy + i * 2.6 * u, 0.75 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(shirt, 0.3);
      ctx.beginPath(); ctx.arc(sx - 0.15 * u, yy + i * 2.6 * u - 0.15 * u, 0.35 * u, 0, Math.PI * 2); ctx.fill();
    }
  }
  // плечи с объёмным градиентом + тонкий верхний блик (rim light)
  const shG = ctx.createLinearGradient(0, yy - 3.2 * u, 0, yy - 0.4 * u);
  shG.addColorStop(0, shade(shirt, 0.2)); shG.addColorStop(1, shade(shirt, 0.02));
  ctx.fillStyle = shG;
  rr(ctx, sx - 8 * u, yy - 3.2 * u, 16 * u, 2.8 * u, 3); ctx.fill();
  rimLight(ctx, () => rr(ctx, sx - 8 * u, yy - 3.2 * u, 16 * u, 2.8 * u, 3), 0.28);

  // шея с мягкой тенью от подбородка
  ctx.fillStyle = shade(skin, -0.05);
  ctx.beginPath(); ctx.ellipse(sx, yy - 3.8 * u, 2.3 * u, 2.1 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(160,120,100,0.3)';
  ctx.beginPath(); ctx.ellipse(sx, yy - 4.6 * u, 2.1 * u, 0.9 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // голова — фарфоровый многоступенчатый градиент (тёплый блик сверху-слева, отражённый свет снизу)
  const hg = ctx.createRadialGradient(sx - 2 * u, yy - 8.4 * u, 0.5 * u, sx, yy - 5.6 * u, 8 * u);
  hg.addColorStop(0, shade(skin, 0.24));
  hg.addColorStop(0.45, shade(skin, 0.08));
  hg.addColorStop(0.8, shade(skin, -0.05));
  hg.addColorStop(1, shade(skin, -0.14));
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.ellipse(sx, yy - 6 * u, 6.8 * u, 7 * u, 0, 0, Math.PI * 2); ctx.fill();
  // отражённый тёплый свет снизу подбородка
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255,200,150,0.08)';
  ctx.beginPath(); ctx.ellipse(sx, yy - 2 * u, 4 * u, 1.6 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // волосы
  drawHair(ctx, sx, yy, u, hair, look.hairStyle, girl);

  // перекрываем волосы на лице — рисуем лицо поверх (тот же премиальный градиент)
  const faceG = ctx.createRadialGradient(sx - 2 * u, yy - 8.4 * u, 0.5 * u, sx, yy - 5.6 * u, 7.6 * u);
  faceG.addColorStop(0, girl ? shade(skin, 0.3) : shade(skin, 0.2));
  faceG.addColorStop(0.55, shade(skin, 0.04));
  faceG.addColorStop(1, shade(skin, -0.08));
  ctx.fillStyle = faceG;
  ctx.beginPath(); ctx.ellipse(sx, yy - 6 * u, 6.4 * u, 6.6 * u, 0, 0, Math.PI * 2); ctx.fill();

  // мягкая тень от волос у висков/лба (multiply)
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.16;
  ctx.fillStyle = shade(hair, 0.1);
  ctx.beginPath(); ctx.ellipse(sx - 5 * u, yy - 8 * u, 1.8 * u, 2.6 * u, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx + 5 * u, yy - 8 * u, 1.8 * u, 2.6 * u, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // румянец — мягкий multiply-градиент на щеках
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  for (const bx of [-1, 1]) {
    const blushG = ctx.createRadialGradient(sx + bx * 3.6 * u, yy - 4.3 * u, 0, sx + bx * 3.6 * u, yy - 4.3 * u, 2.2 * u);
    blushG.addColorStop(0, girl ? 'rgba(255,150,160,0.4)' : 'rgba(255,170,150,0.22)');
    blushG.addColorStop(1, 'rgba(255,150,160,0)');
    ctx.fillStyle = blushG;
    ctx.beginPath(); ctx.ellipse(sx + bx * 3.6 * u, yy - 4.3 * u, 2.2 * u, 1.5 * u, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // брови — разные для мальчика и девочки
  ctx.lineCap = 'round';
  if (girl) {
    ctx.strokeStyle = shade(hair, -0.2); ctx.lineWidth = 0.8 * u;
    ctx.beginPath(); ctx.moveTo(sx - 3.8 * u, yy - 9.6 * u); ctx.quadraticCurveTo(sx - 2.2 * u, yy - 10.4 * u, sx - 1.2 * u, yy - 9.8 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 1.2 * u, yy - 9.8 * u); ctx.quadraticCurveTo(sx + 2.2 * u, yy - 10.4 * u, sx + 3.8 * u, yy - 9.6 * u); ctx.stroke();
  } else {
    ctx.strokeStyle = shade(hair, -0.3); ctx.lineWidth = 1.4 * u;
    ctx.beginPath(); ctx.moveTo(sx - 4.0 * u, yy - 9.4 * u); ctx.quadraticCurveTo(sx - 2 * u, yy - 10.0 * u, sx - 1.0 * u, yy - 9.4 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 1.0 * u, yy - 9.4 * u); ctx.quadraticCurveTo(sx + 2 * u, yy - 10.0 * u, sx + 4.0 * u, yy - 9.4 * u); ctx.stroke();
  }

  // веко — мягкая линия-складка над глазом
  ctx.strokeStyle = shade(skin, -0.16); ctx.lineWidth = 0.5 * u; ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(sx - 4.4 * u, yy - 7.6 * u); ctx.quadraticCurveTo(sx - 2.8 * u, yy - 8.5 * u, sx - 1.1 * u, yy - 7.7 * u); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx + 1.1 * u, yy - 7.7 * u); ctx.quadraticCurveTo(sx + 2.8 * u, yy - 8.5 * u, sx + 4.4 * u, yy - 7.6 * u); ctx.stroke();
  ctx.globalAlpha = 1;

  // белки глаз с лёгкой тенью в уголках
  const eyeRy = girl ? 1.8 * u : 1.5 * u;
  for (const ex of [-2.8, 2.8]) {
    const eg = ctx.createRadialGradient(sx + ex * u, yy - 6.9 * u, 0, sx + ex * u, yy - 6.8 * u, 2 * u);
    eg.addColorStop(0, '#ffffff'); eg.addColorStop(1, '#eef0f2');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.ellipse(sx + ex * u, yy - 6.8 * u, 2 * u, eyeRy, 0, 0, Math.PI * 2); ctx.fill();
  }
  // ресницы у девочки — изогнутые, объёмные
  if (girl) {
    ctx.strokeStyle = shade(hair, -0.25); ctx.lineCap = 'round';
    for (const [ex, ea, lw] of [[-4.6, -0.35, 0.85], [-3.3, -0.62, 0.95], [-1.9, -0.78, 0.85], [1.9, -Math.PI + 0.78, 0.85], [3.3, -Math.PI + 0.62, 0.95], [4.6, -Math.PI + 0.35, 0.85]]) {
      ctx.lineWidth = lw * u;
      const x0 = sx + ex * u, y0 = yy - 8.35 * u;
      const x1 = x0 + Math.cos(ea) * 1.5 * u, y1 = y0 + Math.sin(ea) * 1.5 * u;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + Math.cos(ea + 1) * 0.3 * u, (y0 + y1) / 2 + Math.sin(ea + 1) * 0.3 * u, x1, y1); ctx.stroke();
    }
  }
  // радужка с градиентом + зрачок + двойной блик
  for (const ex of [-2.8, 2.8]) {
    const irisX = sx + ex * u, irisY = yy - 6.8 * u;
    const ig = ctx.createRadialGradient(irisX, irisY, 0.2 * u, irisX, irisY, 1.25 * u);
    ig.addColorStop(0, shade(hair, 0.3)); ig.addColorStop(0.55, shade(hair, -0.1)); ig.addColorStop(1, shade(hair, -0.4));
    ctx.fillStyle = ig;
    ctx.beginPath(); ctx.arc(irisX, irisY, 1.25 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1210';
    ctx.beginPath(); ctx.arc(irisX, irisY, 0.62 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(irisX - 0.55 * u, irisY - 0.55 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(irisX + 0.6 * u, irisY + 0.45 * u, 0.24 * u, 0, Math.PI * 2); ctx.fill();
  }

  // нос
  ctx.strokeStyle = shade(skin, girl ? -0.14 : -0.24); ctx.lineWidth = (girl ? 0.7 : 0.95) * u; ctx.lineCap = 'round';
  if (girl) {
    // маленький аккуратный носик — две точки-ноздри + мягкий блик-переносица
    ctx.fillStyle = shade(skin, girl ? -0.14 : -0.24);
    ctx.beginPath(); ctx.arc(sx - 0.9 * u, yy - 4.6 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 0.9 * u, yy - 4.6 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.5 * u;
    ctx.beginPath(); ctx.moveTo(sx - 0.3 * u, yy - 6.6 * u); ctx.lineTo(sx - 0.55 * u, yy - 5 * u); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(sx + 0.8 * u, yy - 4.2 * u, 1.3 * u, Math.PI * 0.65, Math.PI * 0.35, true); ctx.stroke();
  }

  // губы / улыбка
  if (girl) {
    // розовые губки с градиентом и глянцевым бликом
    const lipG = ctx.createLinearGradient(sx, yy - 3.4 * u, sx, yy - 2.2 * u);
    lipG.addColorStop(0, '#f0a3b4'); lipG.addColorStop(1, '#d9788e');
    ctx.fillStyle = lipG;
    ctx.beginPath(); ctx.ellipse(sx, yy - 2.8 * u, 1.8 * u, 0.85 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(skin, -0.3); ctx.lineWidth = 0.85 * u;
    ctx.beginPath(); ctx.arc(sx, yy - 2.0 * u, 1.8 * u, Math.PI * 0.22, Math.PI * 0.78); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(sx - 0.6 * u, yy - 3 * u, 0.5 * u, 0.22 * u, -0.2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = shade(skin, -0.34); ctx.lineWidth = 1.1 * u;
    ctx.beginPath(); ctx.arc(sx, yy - 2.2 * u, 2.3 * u, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
  }

  drawHat(ctx, sx, yy - 12.5 * u, u, look.hat);
  drawAcc(ctx, sx, yy, u, look.acc, girl);
  // транспорт рисуется поверх ног
  drawVehicle(ctx, sx, sy, T, veh, phase);
}

function drawAcc(ctx, sx, yy, u, acc, girl) {
  if (!acc || acc === 'none') return;
  ctx.save();
  ctx.lineCap = 'round';
  const eyeY = yy - 6.8 * u;

  if (acc === 'gafas') {
    ctx.fillStyle = 'rgba(180,220,240,0.45)';
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 0.85 * u;
    rr(ctx, sx - 4.8 * u, eyeY - 1.2 * u, 3.4 * u, 2.2 * u, 1.2); ctx.fill(); ctx.stroke();
    rr(ctx, sx + 1.4 * u, eyeY - 1.2 * u, 3.4 * u, 2.2 * u, 1.2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 1.4 * u, eyeY - 0.1 * u); ctx.lineTo(sx + 1.4 * u, eyeY - 0.1 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 4.8 * u, eyeY - 0.1 * u); ctx.lineTo(sx - 6.2 * u, eyeY + 0.6 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 4.8 * u, eyeY - 0.1 * u); ctx.lineTo(sx + 6.2 * u, eyeY + 0.6 * u); ctx.stroke();
  } else if (acc === 'sol') {
    ctx.fillStyle = 'rgba(30,15,70,0.82)';
    rr(ctx, sx - 4.8 * u, eyeY - 1.2 * u, 3.4 * u, 2.2 * u, 1.2); ctx.fill();
    rr(ctx, sx + 1.4 * u, eyeY - 1.2 * u, 3.4 * u, 2.2 * u, 1.2); ctx.fill();
    ctx.strokeStyle = '#2a1a4a'; ctx.lineWidth = 0.85 * u;
    ctx.beginPath(); ctx.moveTo(sx - 1.4 * u, eyeY - 0.1 * u); ctx.lineTo(sx + 1.4 * u, eyeY - 0.1 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - 4.8 * u, eyeY - 0.1 * u); ctx.lineTo(sx - 6.2 * u, eyeY + 0.6 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 4.8 * u, eyeY - 0.1 * u); ctx.lineTo(sx + 6.2 * u, eyeY + 0.6 * u); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(sx - 4.2 * u, eyeY - 0.9 * u, 0.8 * u, 0.6 * u);
    ctx.fillRect(sx + 2.0 * u, eyeY - 0.9 * u, 0.8 * u, 0.6 * u);
  } else if (acc === 'pendientes' && girl) {
    ctx.fillStyle = '#f4c430';
    ctx.beginPath(); ctx.arc(sx - 6.8 * u, eyeY + 1.6 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 6.8 * u, eyeY + 1.6 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(sx - 7.2 * u, eyeY + 1.2 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 6.4 * u, eyeY + 1.2 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
  } else if (acc === 'bufanda') {
    const scarfG = ctx.createLinearGradient(sx - 8 * u, 0, sx + 8 * u, 0);
    scarfG.addColorStop(0, '#e23a6e'); scarfG.addColorStop(0.5, '#ff6b9d'); scarfG.addColorStop(1, '#e23a6e');
    ctx.fillStyle = scarfG;
    rr(ctx, sx - 6.5 * u, yy - 4.5 * u, 13 * u, 2.8 * u, 3); ctx.fill();
    ctx.strokeStyle = '#c0306a'; ctx.lineWidth = 0.6 * u;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(sx + i * 1.1 * u, yy - 1.7 * u); ctx.lineTo(sx + i * 1.1 * u, yy - 0.2 * u); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHair(ctx, sx, yy, u, hair, style, girl) {
  // объёмный градиент: тёплый блик сверху-слева → насыщенный тон → тень снизу-справа
  const hairG = ctx.createLinearGradient(sx - 6 * u, yy - 14 * u, sx + 5 * u, yy - 3 * u);
  hairG.addColorStop(0, shade(hair, 0.32));
  hairG.addColorStop(0.35, shade(hair, 0.06));
  hairG.addColorStop(0.75, shade(hair, -0.12));
  hairG.addColorStop(1, shade(hair, -0.26));
  ctx.fillStyle = hairG;
  if (style === 'curly') {
    const curls = [[-6, -9], [-3.5, -11.8], [0, -13], [3.5, -11.8], [6, -9], [-5, -7.2], [5, -7.2], [0, -8]];
    for (const [dx, dy] of curls) { ctx.beginPath(); ctx.arc(sx + dx * u, yy + dy * u, 3.4 * u, 0, Math.PI * 2); ctx.fill(); }
    // лёгкий глянец на завитках — тонкие блики-полумесяцы, не «залысины»
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(sx - 2 * u, yy - 13.3 * u, 1 * u, Math.PI * 1.1, Math.PI * 1.9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(sx + 3.2 * u, yy - 11.8 * u, 0.7 * u, Math.PI * 1.1, Math.PI * 1.9); ctx.fill();
    ctx.beginPath(); ctx.arc(sx - 5.2 * u, yy - 8.6 * u, 0.9 * u, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'ponytail') {
    ctx.beginPath(); ctx.arc(sx, yy - 8.8 * u, 6.8 * u, Math.PI, 0); ctx.fill();
    ctx.fillRect(sx - 6.8 * u, yy - 10.5 * u, 2.6 * u, 6 * u);
    ctx.fillRect(sx + 4.2 * u, yy - 10.5 * u, 2.6 * u, 6 * u);
    // хвостик
    ctx.beginPath(); ctx.moveTo(sx + 5 * u, yy - 8 * u);
    ctx.quadraticCurveTo(sx + 10 * u, yy - 4 * u, sx + 7 * u, yy + 2 * u);
    ctx.quadraticCurveTo(sx + 11 * u, yy - 3 * u, sx + 8 * u, yy - 8 * u);
    ctx.closePath(); ctx.fill();
    // блик-прядь через верх головы + вдоль хвоста
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.9 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx - 3.5 * u, yy - 13.4 * u); ctx.quadraticCurveTo(sx, yy - 15 * u, sx + 3.2 * u, yy - 13.2 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 6.2 * u, yy - 6.5 * u); ctx.quadraticCurveTo(sx + 9.5 * u, yy - 3 * u, sx + 7.3 * u, yy); ctx.stroke();
  } else {
    // короткие
    ctx.beginPath(); ctx.arc(sx, yy - 9 * u, 7 * u, Math.PI, 0); ctx.fill();
    ctx.fillRect(sx - 7 * u, yy - 10.5 * u, 2.6 * u, 6.5 * u);
    ctx.fillRect(sx + 4.4 * u, yy - 10.5 * u, 2.6 * u, 6.5 * u);
    if (!girl) {
      // чёлка
      ctx.fillRect(sx - 5.5 * u, yy - 12.5 * u, 11 * u, 3 * u);
    }
    // блик-прядь по макушке
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.9 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx - 4.2 * u, yy - 14.6 * u); ctx.quadraticCurveTo(sx, yy - 16 * u, sx + 4 * u, yy - 14.5 * u); ctx.stroke();
  }
}

function drawHat(ctx, x, y, u, hat) {
  if (!hat || hat === 'none') return;
  if (hat === 'gorra') {
    ctx.fillStyle = '#e76f51';
    rr(ctx, x - 6.5 * u, y, 13 * u, 3.5 * u, 2); ctx.fill();
    // козырёк
    ctx.fillStyle = '#c2563c';
    ctx.beginPath();
    ctx.ellipse(x + 1 * u, y + 2.5 * u, 6 * u, 1.8 * u, 0.2, 0, Math.PI * 2); ctx.fill();
    // блик на кепке
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(x - 2 * u, y + 0.5 * u, 4 * u, Math.PI, 0); ctx.fill();
  } else if (hat === 'sombrero') {
    ctx.fillStyle = '#e7c873';
    ctx.beginPath(); ctx.ellipse(x, y + 3 * u, 11 * u, 3 * u, 0, 0, Math.PI * 2); ctx.fill();
    rr(ctx, x - 5 * u, y - 3 * u, 10 * u, 6 * u, 3); ctx.fill();
    ctx.strokeStyle = '#c9a850'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y + 3 * u, 11 * u, 3 * u, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (hat === 'boina') {
    ctx.fillStyle = '#46587f';
    ctx.beginPath(); ctx.ellipse(x - 2 * u, y + 1 * u, 7.5 * u, 3.5 * u, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade('#46587f', 0.2);
    ctx.beginPath(); ctx.arc(x - 2 * u, y + 1 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
  } else if (hat === 'corona') {
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.moveTo(x - 6 * u, y + 3 * u); ctx.lineTo(x - 6 * u, y - 1 * u); ctx.lineTo(x - 2 * u, y + 1 * u);
    ctx.lineTo(x, y - 4 * u); ctx.lineTo(x + 2 * u, y + 1 * u); ctx.lineTo(x + 6 * u, y - 1 * u);
    ctx.lineTo(x + 6 * u, y + 3 * u); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c9a215'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#e23a6e'; ctx.beginPath(); ctx.arc(x, y - 2.5 * u, 1.3 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a8a5f';
    ctx.beginPath(); ctx.arc(x - 4 * u, y + 0.5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4 * u, y + 0.5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
  } else if (hat === 'lazo') {
    ctx.fillStyle = '#e23a6e';
    ctx.beginPath(); ctx.ellipse(x - 3.5 * u, y + 2 * u, 3.8 * u, 2.5 * u, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 3.5 * u, y + 2 * u, 3.8 * u, 2.5 * u, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c22a58'; ctx.beginPath(); ctx.arc(x, y + 2 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
  } else if (hat === 'flor') {
    ctx.fillStyle = '#f15b9a';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(x + 5 * u + Math.cos(a) * 2.2 * u, y + 1 * u + Math.sin(a) * 2.2 * u, 2.2 * u, 1.3 * u, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 5 * u, y + 1 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- NPC ----------
export function drawNPC(ctx, sx, sy, T, pal, phase) {
  const u = T / 26;
  const bob = Math.sin(phase * 0.5) * 0.8;
  const yy = sy + bob;

  // мягкая тень
  softShadow(ctx, sx, sy + 11 * u, 8 * u, 4 * u, 0.2);

  // ноги с объёмом + обувь
  const legColor = shade(pal.skin, -0.12);
  for (const side of [-1, 1]) {
    const lx = sx + side * 2.75 * u;
    const lg = ctx.createLinearGradient(lx - 1.9 * u, 0, lx + 1.9 * u, 0);
    lg.addColorStop(0, shade(legColor, -0.08)); lg.addColorStop(0.5, shade(legColor, 0.06)); lg.addColorStop(1, shade(legColor, -0.08));
    ctx.fillStyle = lg;
    rr(ctx, lx - 1.75 * u, yy + 6 * u, 3.5 * u, 5 * u, 1.5); ctx.fill();
    ctx.fillStyle = shade(pal.shirt, -0.35);
    rr(ctx, lx - 1.9 * u, yy + 9.6 * u, 3.9 * u, 1.7 * u, 1); ctx.fill();
  }

  // тело — объёмный градиент + мягкая складка-тень
  const ng = ctx.createLinearGradient(sx - 6 * u, 0, sx + 6 * u, 0);
  ng.addColorStop(0, shade(pal.shirt, -0.14)); ng.addColorStop(0.45, shade(pal.shirt, 0.08)); ng.addColorStop(0.55, shade(pal.shirt, 0.08)); ng.addColorStop(1, shade(pal.shirt, -0.14));
  ctx.fillStyle = ng;
  rr(ctx, sx - 6 * u, yy - 1 * u, 12 * u, 9 * u, 2); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.18;
  ctx.strokeStyle = shade(pal.shirt, -0.3); ctx.lineWidth = 1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx - 2 * u, yy + 0.5 * u); ctx.lineTo(sx - 2.6 * u, yy + 7.5 * u); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx + 2 * u, yy + 0.5 * u); ctx.lineTo(sx + 2.6 * u, yy + 7.5 * u); ctx.stroke();
  ctx.restore();
  // плечи с бликом
  const nshG = ctx.createLinearGradient(0, yy - 2.5 * u, 0, yy + 0.3 * u);
  nshG.addColorStop(0, shade(pal.shirt, 0.18)); nshG.addColorStop(1, shade(pal.shirt, 0.02));
  ctx.fillStyle = nshG;
  rr(ctx, sx - 7 * u, yy - 2.5 * u, 14 * u, 2.8 * u, 2); ctx.fill();
  rimLight(ctx, () => rr(ctx, sx - 7 * u, yy - 2.5 * u, 14 * u, 2.8 * u, 2), 0.22);

  // шея
  ctx.fillStyle = shade(pal.skin, -0.05);
  ctx.beginPath(); ctx.ellipse(sx, yy - 2.5 * u, 2.1 * u, 1.9 * u, 0, 0, Math.PI * 2); ctx.fill();

  // голова — фарфоровый градиент, как у игрока
  const nhg = ctx.createRadialGradient(sx - 1.8 * u, yy - 7.9 * u, 0.4 * u, sx, yy - 5.4 * u, 7.4 * u);
  nhg.addColorStop(0, shade(pal.skin, 0.24)); nhg.addColorStop(0.45, shade(pal.skin, 0.08));
  nhg.addColorStop(0.8, shade(pal.skin, -0.04)); nhg.addColorStop(1, shade(pal.skin, -0.12));
  ctx.fillStyle = nhg;
  ctx.beginPath(); ctx.ellipse(sx, yy - 6 * u, 6.2 * u, 6.4 * u, 0, 0, Math.PI * 2); ctx.fill();

  // волосы NPC с объёмным градиентом и бликом
  const nHairG = ctx.createLinearGradient(sx - 5.5 * u, yy - 13 * u, sx + 4.5 * u, yy - 4 * u);
  nHairG.addColorStop(0, shade(pal.hair, 0.28)); nHairG.addColorStop(0.4, shade(pal.hair, 0.02));
  nHairG.addColorStop(1, shade(pal.hair, -0.22));
  ctx.fillStyle = nHairG;
  ctx.beginPath(); ctx.arc(sx, yy - 8.8 * u, 6.4 * u, Math.PI, 0); ctx.fill();
  ctx.fillRect(sx - 6.4 * u, yy - 10.2 * u, 2.5 * u, 5.8 * u);
  ctx.fillRect(sx + 3.9 * u, yy - 10.2 * u, 2.5 * u, 5.8 * u);
  ctx.strokeStyle = 'rgba(255,255,255,0.26)'; ctx.lineWidth = 0.8 * u; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx - 3.6 * u, yy - 13.6 * u); ctx.quadraticCurveTo(sx, yy - 14.9 * u, sx + 3.2 * u, yy - 13.4 * u); ctx.stroke();

  // румянец
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  for (const bx of [-1, 1]) {
    const blushG = ctx.createRadialGradient(sx + bx * 3.3 * u, yy - 4.3 * u, 0, sx + bx * 3.3 * u, yy - 4.3 * u, 1.9 * u);
    blushG.addColorStop(0, 'rgba(255,160,150,0.28)'); blushG.addColorStop(1, 'rgba(255,160,150,0)');
    ctx.fillStyle = blushG;
    ctx.beginPath(); ctx.ellipse(sx + bx * 3.3 * u, yy - 4.3 * u, 1.9 * u, 1.3 * u, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // брови
  ctx.strokeStyle = shade(pal.hair, -0.2); ctx.lineWidth = 1 * u; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx - 3.6 * u, yy - 9 * u); ctx.quadraticCurveTo(sx - 2.2 * u, yy - 9.6 * u, sx - 1 * u, yy - 9 * u); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx + 1 * u, yy - 9 * u); ctx.quadraticCurveTo(sx + 2.2 * u, yy - 9.6 * u, sx + 3.6 * u, yy - 9 * u); ctx.stroke();

  // глаза NPC — с радужкой-градиентом и двойным бликом
  for (const ex of [-2.4, 2.4]) {
    const eg = ctx.createRadialGradient(sx + ex * u, yy - 6.6 * u, 0, sx + ex * u, yy - 6.5 * u, 1.7 * u);
    eg.addColorStop(0, '#ffffff'); eg.addColorStop(1, '#eaecef');
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.ellipse(sx + ex * u, yy - 6.5 * u, 1.7 * u, 1.4 * u, 0, 0, Math.PI * 2); ctx.fill();
    const ig = ctx.createRadialGradient(sx + ex * u, yy - 6.5 * u, 0.15 * u, sx + ex * u, yy - 6.5 * u, 1 * u);
    ig.addColorStop(0, shade(pal.hair, 0.25)); ig.addColorStop(0.6, shade(pal.hair, -0.1)); ig.addColorStop(1, shade(pal.hair, -0.35));
    ctx.fillStyle = ig;
    ctx.beginPath(); ctx.arc(sx + ex * u, yy - 6.5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1210';
    ctx.beginPath(); ctx.arc(sx + ex * u, yy - 6.5 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(sx + ex * u - 0.45 * u, yy - 7 * u, 0.42 * u, 0, Math.PI * 2); ctx.fill();
  }

  // нос — мягкая тень-штрих
  ctx.strokeStyle = shade(pal.skin, -0.2); ctx.lineWidth = 0.65 * u; ctx.lineCap = 'round'; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(sx, yy - 5.6 * u); ctx.quadraticCurveTo(sx + 0.6 * u, yy - 4.4 * u, sx, yy - 4 * u); ctx.stroke();
  ctx.globalAlpha = 1;

  // улыбка
  ctx.strokeStyle = shade(pal.skin, -0.3); ctx.lineWidth = 0.9 * u; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(sx, yy - 2.6 * u, 1.9 * u, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();

  // значок разговора — с мягким фоном
  const floatY = yy - 14 * u - (1 + Math.sin(phase)) * 1.5 * u;
  softShadow(ctx, sx, floatY + T * 0.05, T * 0.26, T * 0.15, 0.12);
  const bubbleG = ctx.createRadialGradient(sx - T * 0.06, floatY - T * 0.06, 0, sx, floatY, T * 0.26);
  bubbleG.addColorStop(0, '#ffffff'); bubbleG.addColorStop(1, '#f0eee8');
  ctx.fillStyle = bubbleG;
  ctx.beginPath(); ctx.arc(sx, floatY, T * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(100,150,200,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(sx, floatY, T * 0.24, 0, Math.PI * 2); ctx.stroke();
  ctx.font = `${Math.round(T * 0.38)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💬', sx, floatY);
}

// ---------- дерево ----------
export function drawTree(ctx, sx, sy, T) {
  softShadow(ctx, sx + T * 0.1, sy + T * 0.43, T * 0.42, T * 0.14, 0.18);
  // ствол с объёмным градиентом коры
  const trunkG = ctx.createLinearGradient(sx - T * 0.07, 0, sx + T * 0.07, 0);
  trunkG.addColorStop(0, shade('#7a5a30', -0.15)); trunkG.addColorStop(0.5, shade('#7a5a30', 0.1)); trunkG.addColorStop(1, shade('#7a5a30', -0.15));
  ctx.fillStyle = trunkG;
  rr(ctx, sx - T * 0.065, sy + T * 0.06, T * 0.13, T * 0.38, 3); ctx.fill();
  // тёмный слой кроны (тень внутри)
  ctx.fillStyle = '#2f6538';
  ctx.beginPath(); ctx.arc(sx, sy - T * 0.08, T * 0.46, 0, Math.PI * 2); ctx.fill();
  // основная крона
  ctx.fillStyle = '#3f8848';
  ctx.beginPath(); ctx.arc(sx, sy - T * 0.12, T * 0.42, 0, Math.PI * 2); ctx.fill();
  // боковые кустики
  ctx.fillStyle = '#4e9e58';
  ctx.beginPath(); ctx.arc(sx - T * 0.2, sy - T * 0.26, T * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + T * 0.18, sy - T * 0.24, T * 0.26, 0, Math.PI * 2); ctx.fill();
  // верхний светлый слой
  ctx.fillStyle = '#60b268';
  ctx.beginPath(); ctx.arc(sx, sy - T * 0.32, T * 0.22, 0, Math.PI * 2); ctx.fill();
  // блик
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.arc(sx - T * 0.12, sy - T * 0.3, T * 0.13, 0, Math.PI * 2); ctx.fill();
  // отдельные листья-мазки для объёма кроны
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let i = 0; i < 6; i++) {
    const a = tileHash((sx | 0), (sy | 0), i) * Math.PI * 2;
    const r = T * (0.16 + tileHash((sx | 0), (sy | 0), i + 30) * 0.2);
    ctx.beginPath();
    ctx.ellipse(sx + Math.cos(a) * r, sy - T * 0.12 + Math.sin(a) * r * 0.7, T * 0.05, T * 0.03, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- сундук ----------
export function drawChest(ctx, sx, sy, T, open, pulse) {
  const w = T * 0.7, h = T * 0.52;
  if (!open) {
    const r = T * (0.55 + 0.12 * pulse);
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
    g.addColorStop(0, 'rgba(255,225,120,0.75)'); g.addColorStop(1, 'rgba(255,225,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  }
  softShadow(ctx, sx, sy + h * 0.58, w * 0.62, 4.5, 0.22);

  const bodyC = open ? '#8a7d6a' : '#9a6b3a';
  const lidC  = open ? '#a99a86' : '#c08a50';
  // корпус — деревянный градиент с волокнами
  const bodyG = ctx.createLinearGradient(sx - w / 2, 0, sx + w / 2, 0);
  bodyG.addColorStop(0, shade(bodyC, -0.16)); bodyG.addColorStop(0.5, shade(bodyC, 0.08)); bodyG.addColorStop(1, shade(bodyC, -0.16));
  ctx.fillStyle = bodyG;
  rr(ctx, sx - w / 2, sy - h * 0.1, w, h * 0.6, [0, 0, 4, 4]); ctx.fill();
  ctx.save();
  rr(ctx, sx - w / 2, sy - h * 0.1, w, h * 0.6, [0, 0, 4, 4]); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.8;
  for (let ly = sy - h * 0.06; ly < sy + h * 0.5; ly += 4) { ctx.beginPath(); ctx.moveTo(sx - w / 2, ly); ctx.lineTo(sx + w / 2, ly); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = shade(bodyC, -0.28); ctx.lineWidth = 1.5;
  ctx.strokeRect(sx - w / 2 + 3, sy - h * 0.1 + 3, w - 6, h * 0.6 - 4);
  // металлические уголки корпуса
  ctx.fillStyle = shade('#f4c430', -0.1);
  for (const cx2 of [sx - w / 2 + 2, sx + w / 2 - 6]) { rr(ctx, cx2, sy - h * 0.06, 4, 6, 1); ctx.fill(); }

  // крышка — объёмный градиент
  const lg = ctx.createLinearGradient(sx - w / 2, sy - h * 0.5, sx + w / 2, sy - h * 0.1);
  lg.addColorStop(0, shade(lidC, 0.2)); lg.addColorStop(0.5, shade(lidC, 0.02)); lg.addColorStop(1, shade(lidC, -0.14));
  ctx.fillStyle = lg;
  rr(ctx, sx - w / 2, sy - h * 0.5, w, h * 0.45, [4, 4, 0, 0]); ctx.fill();
  rimLight(ctx, () => rr(ctx, sx - w / 2, sy - h * 0.5, w, h * 0.45, [4, 4, 0, 0]), 0.3);

  // латунная окантовка с бликом
  const bandG = ctx.createLinearGradient(0, sy - h * 0.14, 0, sy - h * 0.1);
  bandG.addColorStop(0, '#ffe089'); bandG.addColorStop(1, '#c9932e');
  ctx.fillStyle = bandG;
  ctx.fillRect(sx - w / 2, sy - h * 0.12, w, 3);
  rr(ctx, sx - w / 2, sy - h * 0.5, w, 3, 2); ctx.fill();

  if (!open) {
    const lockG = ctx.createLinearGradient(sx - 4.5, sy - h * 0.45, sx + 4.5, sy - h * 0.35);
    lockG.addColorStop(0, '#ffe089'); lockG.addColorStop(1, '#c9932e');
    ctx.fillStyle = lockG;
    rr(ctx, sx - 4.5, sy - h * 0.45, 9, 10, 2); ctx.fill();
    ctx.fillStyle = shade('#f4c430', -0.3);
    ctx.beginPath(); ctx.arc(sx, sy - h * 0.18, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(sx - 1, sy - h * 0.4, 1, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawBush(ctx, sx, sy, T) {
  softShadow(ctx, sx + T * 0.06, sy + T * 0.33, T * 0.36, T * 0.1, 0.15);
  ctx.fillStyle = '#469450';
  ctx.beginPath(); ctx.arc(sx, sy, T * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#58ad62';
  ctx.beginPath(); ctx.arc(sx - T * 0.14, sy - T * 0.1, T * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + T * 0.13, sy - T * 0.08, T * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.arc(sx - T * 0.1, sy - T * 0.12, T * 0.1, 0, Math.PI * 2); ctx.fill();
  // мелкие тёмные проколы — имитация листвы
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 4; i++) {
    const a = tileHash((sx | 0), (sy | 0), i + 50) * Math.PI * 2;
    const r = T * 0.16 * tileHash((sx | 0), (sy | 0), i + 60);
    ctx.beginPath(); ctx.arc(sx + Math.cos(a) * r, sy + Math.sin(a) * r, T * 0.03, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawBench(ctx, sx, sy, T) {
  const u = T / 26;
  softShadow(ctx, sx, sy + 4 * u, 5.5 * u, 1.4 * u, 0.16);
  ctx.fillStyle = shade('#7a5a30', -0.1);
  ctx.fillRect(sx - 4.5 * u, sy, 1.2 * u, 3.5 * u);
  ctx.fillRect(sx + 3.3 * u, sy, 1.2 * u, 3.5 * u);
  const seatG = ctx.createLinearGradient(0, sy - 2.5 * u, 0, sy - 0.5 * u);
  seatG.addColorStop(0, shade('#c4944a', 0.15)); seatG.addColorStop(1, shade('#c4944a', -0.1));
  ctx.fillStyle = seatG;
  rr(ctx, sx - 5 * u, sy - 2.5 * u, 10 * u, 2 * u, 1); ctx.fill();
  const backG = ctx.createLinearGradient(0, sy - 6 * u, 0, sy - 4.5 * u);
  backG.addColorStop(0, shade('#b58438', 0.15)); backG.addColorStop(1, shade('#b58438', -0.1));
  ctx.fillStyle = backG;
  rr(ctx, sx - 5 * u, sy - 6 * u, 10 * u, 1.5 * u, 1); ctx.fill();
  ctx.fillStyle = shade('#7a5a30', -0.1);
  ctx.fillRect(sx - 3.5 * u, sy - 6 * u, 1 * u, 3.5 * u);
  ctx.fillRect(sx + 2.5 * u, sy - 6 * u, 1 * u, 3.5 * u);
}

export function drawLamp(ctx, sx, sy, T) {
  const u = T / 26;
  softShadow(ctx, sx + 1.5 * u, sy + 4.2 * u, 3 * u, 1.2 * u, 0.14);
  const poleG = ctx.createLinearGradient(sx - 1.2 * u, 0, sx + 1.2 * u, 0);
  poleG.addColorStop(0, '#3a3a3a'); poleG.addColorStop(0.5, '#6a6a6a'); poleG.addColorStop(1, '#3a3a3a');
  ctx.fillStyle = poleG;
  ctx.fillRect(sx - 1.2 * u, sy - 8 * u, 1.8 * u, 12 * u);
  ctx.fillStyle = shade('#555', -0.15);
  rr(ctx, sx - 2.5 * u, sy + 3.5 * u, 5 * u, 2 * u, 1); ctx.fill();
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1.2 * u;
  ctx.beginPath(); ctx.moveTo(sx, sy - 8 * u); ctx.lineTo(sx + 4 * u, sy - 8 * u); ctx.stroke();
  const bulbG = ctx.createRadialGradient(sx + 3.3 * u, sy - 7.9 * u, 0, sx + 4 * u, sy - 7.5 * u, 2.4 * u);
  bulbG.addColorStop(0, '#fff6d8'); bulbG.addColorStop(1, '#ffc94a');
  ctx.fillStyle = bulbG;
  ctx.beginPath(); ctx.ellipse(sx + 4 * u, sy - 7.5 * u, 2 * u, 1.5 * u, 0, 0, Math.PI * 2); ctx.fill();
  const gl = ctx.createRadialGradient(sx + 4 * u, sy - 7.5 * u, 0, sx + 4 * u, sy - 7.5 * u, 6 * u);
  gl.addColorStop(0, 'rgba(255,220,100,0.4)'); gl.addColorStop(1, 'rgba(255,220,100,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sx + 4 * u, sy - 7.5 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
}

export function drawMonument(ctx, sx, sy, T, type, pulse) {
  const u = T / 26;
  softShadow(ctx, sx, sy + 6 * u, 6.5 * u, 2 * u, 0.17);

  if (type === 'statue') {
    ctx.fillStyle = '#b8a89a';
    rr(ctx, sx - 4 * u, sy, 8 * u, 6 * u, 1); ctx.fill();
    ctx.fillStyle = '#a09080';
    ctx.beginPath(); ctx.arc(sx, sy - 5 * u, 3.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(sx - 2.5 * u, sy - 5 * u, 5 * u, 7 * u);
    ctx.fillRect(sx - 1 * u, sy - 9 * u, 2 * u, 5 * u);
    ctx.strokeStyle = `rgba(255,220,120,${0.3 + 0.15 * pulse})`; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.arc(sx, sy - 3 * u, 5.5 * u, 0, Math.PI * 2); ctx.stroke();
  } else if (type === 'arch') {
    ctx.fillStyle = '#d4c4b0';
    rr(ctx, sx - 8 * u, sy - 10 * u, 3 * u, 16 * u, 1); ctx.fill();
    rr(ctx, sx + 5 * u, sy - 10 * u, 3 * u, 16 * u, 1); ctx.fill();
    ctx.beginPath(); ctx.arc(sx - 1 * u, sy - 8 * u, 7 * u, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c4b4a0';
    ctx.fillRect(sx - 8 * u, sy - 0.5 * u, 16 * u, 1.5 * u);
  } else if (type === 'obelisk') {
    ctx.fillStyle = '#8a9aa0';
    rr(ctx, sx - 3.5 * u, sy + 1 * u, 7 * u, 5 * u, 1); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx - 3 * u, sy + 1 * u); ctx.lineTo(sx + 3 * u, sy + 1 * u);
    ctx.lineTo(sx + 1.5 * u, sy - 11 * u); ctx.lineTo(sx - 1.5 * u, sy - 11 * u);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.moveTo(sx - 1.5 * u, sy - 11 * u); ctx.lineTo(sx + 1.5 * u, sy - 11 * u);
    ctx.lineTo(sx, sy - 14.5 * u); ctx.closePath(); ctx.fill();
  } else if (type === 'fountain_small') {
    ctx.fillStyle = '#8a9db0';
    ctx.beginPath(); ctx.ellipse(sx, sy + 2 * u, 5.5 * u, 3 * u, 0, 0, Math.PI * 2); ctx.fill();
    const wg = ctx.createRadialGradient(sx, sy + 2 * u, 0, sx, sy + 2 * u, 4.5 * u);
    wg.addColorStop(0, '#c8f0ff'); wg.addColorStop(1, '#72c0dc');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.ellipse(sx, sy + 2 * u, 4.5 * u, 2.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(180,230,250,0.7)'; ctx.lineWidth = 1.2 * u;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(sx, sy + 1 * u);
      ctx.quadraticCurveTo(sx + Math.cos(a) * 3 * u, sy + 1 * u + Math.sin(a) * 1.5 * u - 3 * u,
        sx + Math.cos(a) * 4 * u, sy + 2 * u + Math.sin(a) * 2 * u); ctx.stroke();
    }
  }

  // floating emoji above monument
  ctx.font = `${Math.round(T * 0.36)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const ey = sy - 16 * u - (1 + Math.sin(pulse * Math.PI * 2)) * 1.2 * u;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.arc(sx, ey, T * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.fillText('❓', sx, ey);
}

// ---------- утилита затемнения цвета ----------
function shade(color, amt) {
  // принимает и '#rrggbb', и свой же вывод 'rgb(r,g,b)' — можно шейдить повторно
  let r, g, b;
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    r = +rgbMatch[1]; g = +rgbMatch[2]; b = +rgbMatch[3];
  } else {
    const c = color.replace('#', '');
    r = parseInt(c.slice(0, 2), 16); g = parseInt(c.slice(2, 4), 16); b = parseInt(c.slice(4, 6), 16);
  }
  r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
  return `rgb(${r},${g},${b})`;
}

// деревянная табличка «Ежедневно»
export function drawDailySign(ctx, sx, sy, T, pulse, done) {
  const u = T / 26;
  softShadow(ctx, sx, sy + 10 * u, 9.5 * u, 3.8 * u, 0.2);
  // столбики
  ctx.fillStyle = '#6b4a2b';
  rr(ctx, sx - 8 * u, sy - 6 * u, 2.6 * u, 16 * u, 1); ctx.fill();
  rr(ctx, sx + 5.4 * u, sy - 6 * u, 2.6 * u, 16 * u, 1); ctx.fill();
  // доска
  const g = ctx.createLinearGradient(sx, sy - 10 * u, sx, sy + 1 * u);
  g.addColorStop(0, '#a9743f'); g.addColorStop(1, '#8a5a2e');
  ctx.fillStyle = g;
  rr(ctx, sx - 11 * u, sy - 10 * u, 22 * u, 10.5 * u, 2.5); ctx.fill();
  ctx.strokeStyle = '#5d3d20'; ctx.lineWidth = Math.max(1, u * 0.8);
  rr(ctx, sx - 11 * u, sy - 10 * u, 22 * u, 10.5 * u, 2.5); ctx.stroke();
  // прожилки дерева
  ctx.strokeStyle = 'rgba(93,61,32,0.35)'; ctx.lineWidth = Math.max(1, u * 0.5);
  ctx.beginPath(); ctx.moveTo(sx - 9 * u, sy - 7.4 * u); ctx.lineTo(sx + 9 * u, sy - 7.4 * u); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx - 9 * u, sy - 2.6 * u); ctx.lineTo(sx + 9 * u, sy - 2.6 * u); ctx.stroke();
  // гвоздики
  ctx.fillStyle = '#4a3018';
  for (const dx of [-9.5, 9.5]) { ctx.beginPath(); ctx.arc(sx + dx * u, sy - 8.6 * u, 0.7 * u, 0, Math.PI * 2); ctx.fill(); }
  // надпись
  ctx.save();
  const fs = Math.max(8, T * 0.24);
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fdf3e3';
  ctx.fillText('Ежедневно', sx, sy - 4.7 * u);
  ctx.restore();
  // маркер: галочка если пройдено, пульсирующий ❗ если нет
  ctx.save();
  ctx.font = `${Math.max(10, T * 0.3)}px sans-serif`;
  ctx.textAlign = 'center';
  if (done) ctx.fillText('✅', sx, sy - 12 * u);
  else { ctx.globalAlpha = 0.6 + pulse * 0.4; ctx.fillText('❗', sx, sy - 12 * u - pulse * 2 * u); }
  ctx.restore();
}
