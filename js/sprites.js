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
      if (((tx + ty) & 1) === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(tx * T - cam.x, ty * T - cam.y, T, T);
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
  // чаша — тень
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(sx + 4, sy + 4, T * 1.05, T * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  // чаша
  ctx.fillStyle = '#8a9db0';
  ctx.beginPath(); ctx.ellipse(sx, sy, T * 1.05, T * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  // вода с градиентом
  const wg = ctx.createRadialGradient(sx - T * 0.2, sy - T * 0.1, 0, sx, sy, T * 0.85);
  wg.addColorStop(0, '#b8e8f8'); wg.addColorStop(1, '#72c0dc');
  ctx.fillStyle = wg;
  ctx.beginPath(); ctx.ellipse(sx, sy, T * 0.82, T * 0.48, 0, 0, Math.PI * 2); ctx.fill();
  // бликна воде
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(sx - T * 0.28, sy - T * 0.15, T * 0.22, T * 0.1, -0.3, 0, Math.PI * 2); ctx.fill();
  // столб
  ctx.fillStyle = '#9aa6b2';
  ctx.beginPath(); ctx.ellipse(sx, sy, T * 0.1, T * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  // струи воды
  ctx.strokeStyle = 'rgba(190,235,250,0.75)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + Math.cos(a) * T * 0.32, sy + Math.sin(a) * T * 0.18 - T * 0.2, sx + Math.cos(a) * T * 0.46, sy + Math.sin(a) * T * 0.26);
    ctx.stroke();
  }
}

// ---------- здание ----------
export function drawBuilding(ctx, sx, sy, w, h, loc, T, glow) {
  const dark = shade(loc.color, -0.28);
  const light = shade(loc.color, 0.18);

  // тень под зданием
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(sx + w / 2, sy + h + 5, w / 2.2, 7, 0, 0, Math.PI * 2); ctx.fill();

  // стены с лёгким градиентом
  const wallG = ctx.createLinearGradient(sx, 0, sx + w, 0);
  wallG.addColorStop(0, '#ede5d8');
  wallG.addColorStop(0.45, '#fdf6ee');
  wallG.addColorStop(1, '#e8e0d2');
  ctx.fillStyle = wallG;
  rr(ctx, sx, sy + T * 0.65, w, h - T * 0.65, [0, 0, 4, 4]); ctx.fill();

  // нижний плинтус
  ctx.fillStyle = shade('#fbf3e6', -0.1);
  rr(ctx, sx, sy + h - 9, w, 9, [0, 0, 4, 4]); ctx.fill();

  // крыша с градиентом
  const roofG = ctx.createLinearGradient(sx, sy, sx, sy + T * 0.8);
  roofG.addColorStop(0, light); roofG.addColorStop(1, loc.color);
  ctx.fillStyle = roofG;
  rr(ctx, sx - 4, sy, w + 8, T * 0.82, [5, 5, 0, 0]); ctx.fill();
  // карниз под крышей
  ctx.fillStyle = dark;
  ctx.fillRect(sx - 4, sy + T * 0.7, w + 8, 5);

  // окна
  drawWindow(ctx, sx + w * 0.13, sy + T * 1.0, T * 0.52, T * 0.54);
  drawWindow(ctx, sx + w * 0.6,  sy + T * 1.0, T * 0.52, T * 0.54);

  // ступенька
  const dw = T * 0.74, dx = sx + w / 2 - dw / 2;
  ctx.fillStyle = shade('#fbf3e6', -0.18);
  rr(ctx, dx - 5, sy + h - 5, dw + 10, 5, 2); ctx.fill();

  // дверь
  ctx.fillStyle = dark;
  rr(ctx, dx, sy + h - T * 0.98, dw, T * 0.98, [3, 3, 0, 0]); ctx.fill();
  // блик на двери
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(dx + 3, sy + h - T * 0.95, dw / 2.2 - 2, T * 0.4);
  // ручка
  ctx.fillStyle = '#ffe08a';
  ctx.beginPath(); ctx.arc(dx + dw - 8, sy + h - T * 0.48, 3, 0, Math.PI * 2); ctx.fill();

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
  // внешняя рамка
  ctx.fillStyle = '#7aa0b8';
  rr(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 3); ctx.fill();
  // стекло
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#ceeaf6'); g.addColorStop(0.5, '#dff3fa'); g.addColorStop(1, '#b8e2f0');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 2); ctx.fill();
  // перекладина
  ctx.strokeStyle = '#7aa0b8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  // блик
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x + 2, y + 2, w * 0.38, h * 0.38);
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
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 11 * u, 9 * u, 4 * u, 0, 0, Math.PI * 2); ctx.fill();
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
    ctx.fillStyle = legColor;
    rr(ctx, sx - 5.5 * u - boardOffX, yy + 6 * u + step + boardOffY, 3.8 * u, 5.5 * u, 2); ctx.fill();
    ctx.fillStyle = shoeColor;
    rr(ctx, sx - 6 * u - boardOffX, yy + 10.8 * u + step + boardOffY, 5 * u, 2.2 * u, 1); ctx.fill();
    ctx.fillStyle = legColor;
    rr(ctx, sx + 1.7 * u + boardOffX, yy + 6 * u - step + boardOffY, 3.8 * u, 5.5 * u, 2); ctx.fill();
    ctx.fillStyle = shoeColor;
    rr(ctx, sx + 1.2 * u + boardOffX, yy + 10.8 * u - step + boardOffY, 5 * u, 2.2 * u, 1); ctx.fill();
  }

  // тело
  if (girl) {
    // платье — трапеция
    ctx.fillStyle = shirt;
    ctx.beginPath();
    ctx.moveTo(sx - 6.5 * u, yy - 2 * u);
    ctx.lineTo(sx + 6.5 * u, yy - 2 * u);
    ctx.lineTo(sx + 8.8 * u, yy + 9.5 * u);
    ctx.lineTo(sx - 8.8 * u, yy + 9.5 * u);
    ctx.closePath(); ctx.fill();
    // складки
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx - 2.5 * u, yy + 0.5 * u); ctx.lineTo(sx - 4.5 * u, yy + 9.5 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 2.5 * u, yy + 0.5 * u); ctx.lineTo(sx + 4.5 * u, yy + 9.5 * u); ctx.stroke();
  } else {
    // рубашка мужская
    const sg = ctx.createLinearGradient(sx - 7 * u, 0, sx + 7 * u, 0);
    sg.addColorStop(0, shade(shirt, -0.1)); sg.addColorStop(0.5, shirt); sg.addColorStop(1, shade(shirt, -0.1));
    ctx.fillStyle = sg;
    rr(ctx, sx - 7 * u, yy - 2 * u, 14 * u, 10 * u, 2); ctx.fill();
    // пуговицы
    ctx.fillStyle = shade(shirt, 0.2);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(sx, yy + i * 2.6 * u, 0.7 * u, 0, Math.PI * 2); ctx.fill(); }
  }
  // плечи
  ctx.fillStyle = shade(shirt, 0.12);
  rr(ctx, sx - 8 * u, yy - 3.2 * u, 16 * u, 2.8 * u, 3); ctx.fill();

  // шея
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(sx, yy - 3.8 * u, 2.3 * u, 2.1 * u, 0, 0, Math.PI * 2); ctx.fill();

  // голова
  const hg = ctx.createRadialGradient(sx - 1.5 * u, yy - 8 * u, 0, sx, yy - 6 * u, 7.5 * u);
  hg.addColorStop(0, shade(skin, 0.14)); hg.addColorStop(1, shade(skin, -0.06));
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(sx, yy - 6 * u, 6.8 * u, 0, Math.PI * 2); ctx.fill();

  // волосы
  drawHair(ctx, sx, yy, u, hair, look.hairStyle, girl);

  // перекрываем волосы на лице — рисуем лицо поверх
  const faceG = ctx.createRadialGradient(sx - 1.5 * u, yy - 8 * u, 0, sx, yy - 6 * u, 7.5 * u);
  faceG.addColorStop(0, girl ? shade(skin, 0.22) : shade(skin, 0.14));
  faceG.addColorStop(1, shade(skin, -0.04));
  ctx.fillStyle = faceG;
  ctx.beginPath(); ctx.arc(sx, yy - 6 * u, 6.4 * u, 0, Math.PI * 2); ctx.fill();

  // брови — разные для мальчика и девочки
  ctx.lineCap = 'round';
  if (girl) {
    // тонкие изящные брови с большим зазором
    ctx.strokeStyle = shade(hair, -0.15); ctx.lineWidth = 0.75 * u;
    ctx.beginPath(); ctx.moveTo(sx - 3.8 * u, yy - 9.6 * u); ctx.quadraticCurveTo(sx - 2.2 * u, yy - 10.4 * u, sx - 1.2 * u, yy - 9.8 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 1.2 * u, yy - 9.8 * u); ctx.quadraticCurveTo(sx + 2.2 * u, yy - 10.4 * u, sx + 3.8 * u, yy - 9.6 * u); ctx.stroke();
  } else {
    // мужские — чуть толще и прямее
    ctx.strokeStyle = shade(hair, -0.25); ctx.lineWidth = 1.4 * u;
    ctx.beginPath(); ctx.moveTo(sx - 4.0 * u, yy - 9.4 * u); ctx.quadraticCurveTo(sx - 2 * u, yy - 10.0 * u, sx - 1.0 * u, yy - 9.4 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 1.0 * u, yy - 9.4 * u); ctx.quadraticCurveTo(sx + 2 * u, yy - 10.0 * u, sx + 4.0 * u, yy - 9.4 * u); ctx.stroke();
  }

  // белки глаз
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(sx - 2.8 * u, yy - 6.8 * u, 2 * u, girl ? 1.8 * u : 1.5 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx + 2.8 * u, yy - 6.8 * u, 2 * u, girl ? 1.8 * u : 1.5 * u, 0, 0, Math.PI * 2); ctx.fill();
  // ресницы у девочки
  if (girl) {
    ctx.strokeStyle = shade(hair, -0.2); ctx.lineWidth = 0.7 * u;
    for (const [ex, ea] of [[-4.5, -0.4], [-3.2, -0.6], [-1.8, -0.7], [1.8, -Math.PI + 0.7], [3.2, -Math.PI + 0.6], [4.5, -Math.PI + 0.4]]) {
      ctx.beginPath(); ctx.moveTo(sx + ex * u, yy - 8.4 * u); ctx.lineTo(sx + ex * u + Math.cos(ea) * 1.2 * u, yy - 8.4 * u + Math.sin(ea) * 1.2 * u); ctx.stroke();
    }
  }
  // зрачки
  ctx.fillStyle = '#3a2a22';
  ctx.beginPath(); ctx.arc(sx - 2.8 * u, yy - 6.8 * u, 1.2 * u, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 2.8 * u, yy - 6.8 * u, 1.2 * u, 0, Math.PI * 2); ctx.fill();
  // блики в глазах
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.arc(sx - 2.2 * u, yy - 7.3 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 3.4 * u, yy - 7.3 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();

  // нос
  ctx.strokeStyle = shade(skin, girl ? -0.12 : -0.22); ctx.lineWidth = (girl ? 0.7 : 0.95) * u; ctx.lineCap = 'round';
  if (girl) {
    // маленький аккуратный носик — две точки-ноздри
    ctx.beginPath(); ctx.arc(sx - 0.9 * u, yy - 4.6 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 0.9 * u, yy - 4.6 * u, 0.5 * u, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(sx + 0.8 * u, yy - 4.2 * u, 1.3 * u, Math.PI * 0.65, Math.PI * 0.35, true); ctx.stroke();
  }

  // губы / улыбка
  if (girl) {
    // розовые губки
    ctx.fillStyle = '#e88fa0';
    ctx.beginPath(); ctx.ellipse(sx, yy - 2.8 * u, 1.8 * u, 0.85 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(skin, -0.28); ctx.lineWidth = 0.9 * u;
    ctx.beginPath(); ctx.arc(sx, yy - 2.0 * u, 1.8 * u, Math.PI * 0.22, Math.PI * 0.78); ctx.stroke();
  } else {
    ctx.strokeStyle = shade(skin, -0.32); ctx.lineWidth = 1.1 * u;
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
  ctx.fillStyle = hair;
  if (style === 'curly') {
    const curls = [[-6, -9], [-3.5, -11.8], [0, -13], [3.5, -11.8], [6, -9], [-5, -7.2], [5, -7.2], [0, -8]];
    for (const [dx, dy] of curls) { ctx.beginPath(); ctx.arc(sx + dx * u, yy + dy * u, 3.4 * u, 0, Math.PI * 2); ctx.fill(); }
    // блеск
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(sx - 2 * u, yy - 12.5 * u, 2.2 * u, 0, Math.PI * 2); ctx.fill();
  } else if (style === 'ponytail') {
    ctx.beginPath(); ctx.arc(sx, yy - 8.8 * u, 6.8 * u, Math.PI, 0); ctx.fill();
    ctx.fillRect(sx - 6.8 * u, yy - 10.5 * u, 2.6 * u, 6 * u);
    ctx.fillRect(sx + 4.2 * u, yy - 10.5 * u, 2.6 * u, 6 * u);
    // хвостик
    ctx.beginPath(); ctx.moveTo(sx + 5 * u, yy - 8 * u);
    ctx.quadraticCurveTo(sx + 10 * u, yy - 4 * u, sx + 7 * u, yy + 2 * u);
    ctx.quadraticCurveTo(sx + 11 * u, yy - 3 * u, sx + 8 * u, yy - 8 * u);
    ctx.closePath(); ctx.fill();
  } else {
    // короткие
    ctx.beginPath(); ctx.arc(sx, yy - 9 * u, 7 * u, Math.PI, 0); ctx.fill();
    ctx.fillRect(sx - 7 * u, yy - 10.5 * u, 2.6 * u, 6.5 * u);
    ctx.fillRect(sx + 4.4 * u, yy - 10.5 * u, 2.6 * u, 6.5 * u);
    if (!girl) {
      // чёлка
      ctx.fillRect(sx - 5.5 * u, yy - 12.5 * u, 11 * u, 3 * u);
    }
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

  // тень
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 11 * u, 8 * u, 4 * u, 0, 0, Math.PI * 2); ctx.fill();

  // ноги
  ctx.fillStyle = shade(pal.skin, -0.12);
  rr(ctx, sx - 4.5 * u, yy + 6 * u, 3.5 * u, 5 * u, 1.5); ctx.fill();
  rr(ctx, sx + 1 * u,   yy + 6 * u, 3.5 * u, 5 * u, 1.5); ctx.fill();

  // тело
  const ng = ctx.createLinearGradient(sx - 6 * u, 0, sx + 6 * u, 0);
  ng.addColorStop(0, shade(pal.shirt, -0.1)); ng.addColorStop(0.5, pal.shirt); ng.addColorStop(1, shade(pal.shirt, -0.1));
  ctx.fillStyle = ng;
  rr(ctx, sx - 6 * u, yy - 1 * u, 12 * u, 9 * u, 2); ctx.fill();
  // плечи
  ctx.fillStyle = shade(pal.shirt, 0.12);
  rr(ctx, sx - 7 * u, yy - 2.5 * u, 14 * u, 2.8 * u, 2); ctx.fill();

  // шея
  ctx.fillStyle = pal.skin;
  ctx.beginPath(); ctx.ellipse(sx, yy - 2.5 * u, 2.1 * u, 1.9 * u, 0, 0, Math.PI * 2); ctx.fill();

  // голова
  const nhg = ctx.createRadialGradient(sx - 1 * u, yy - 7.5 * u, 0, sx, yy - 6 * u, 7 * u);
  nhg.addColorStop(0, shade(pal.skin, 0.12)); nhg.addColorStop(1, shade(pal.skin, -0.06));
  ctx.fillStyle = nhg;
  ctx.beginPath(); ctx.arc(sx, yy - 6 * u, 6.2 * u, 0, Math.PI * 2); ctx.fill();

  // волосы NPC
  ctx.fillStyle = pal.hair;
  ctx.beginPath(); ctx.arc(sx, yy - 8.8 * u, 6.4 * u, Math.PI, 0); ctx.fill();
  ctx.fillRect(sx - 6.4 * u, yy - 10.2 * u, 2.5 * u, 5.8 * u);
  ctx.fillRect(sx + 3.9 * u, yy - 10.2 * u, 2.5 * u, 5.8 * u);

  // глаза NPC
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(sx - 2.4 * u, yy - 6.5 * u, 1.7 * u, 1.4 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx + 2.4 * u, yy - 6.5 * u, 1.7 * u, 1.4 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a22';
  ctx.beginPath(); ctx.arc(sx - 2.4 * u, yy - 6.5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + 2.4 * u, yy - 6.5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath(); ctx.arc(sx - 2 * u, yy - 7 * u, 0.42 * u, 0, Math.PI * 2); ctx.fill();

  // значок разговора — с мягким фоном
  const floatY = yy - 14 * u - (1 + Math.sin(phase)) * 1.5 * u;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath(); ctx.arc(sx, floatY, T * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(100,150,200,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(sx, floatY, T * 0.24, 0, Math.PI * 2); ctx.stroke();
  ctx.font = `${Math.round(T * 0.38)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💬', sx, floatY);
}

// ---------- дерево ----------
export function drawTree(ctx, sx, sy, T) {
  // тень
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(sx + T * 0.1, sy + T * 0.43, T * 0.4, T * 0.14, 0.2, 0, Math.PI * 2); ctx.fill();
  // ствол
  ctx.fillStyle = '#7a5a30';
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
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(sx, sy + h * 0.58, w * 0.6, 4, 0, 0, Math.PI * 2); ctx.fill();

  const bodyC = open ? '#8a7d6a' : '#9a6b3a';
  const lidC  = open ? '#a99a86' : '#c08a50';
  ctx.fillStyle = bodyC;
  rr(ctx, sx - w / 2, sy - h * 0.1, w, h * 0.6, [0, 0, 4, 4]); ctx.fill();
  ctx.strokeStyle = shade(bodyC, -0.2); ctx.lineWidth = 1.5;
  ctx.strokeRect(sx - w / 2 + 3, sy - h * 0.1 + 3, w - 6, h * 0.6 - 4);

  const lg = ctx.createLinearGradient(sx - w / 2, sy - h * 0.5, sx + w / 2, sy - h * 0.1);
  lg.addColorStop(0, shade(lidC, 0.12)); lg.addColorStop(1, lidC);
  ctx.fillStyle = lg;
  rr(ctx, sx - w / 2, sy - h * 0.5, w, h * 0.45, [4, 4, 0, 0]); ctx.fill();

  ctx.fillStyle = '#f4c430';
  ctx.fillRect(sx - w / 2, sy - h * 0.12, w, 3);
  rr(ctx, sx - w / 2, sy - h * 0.5, w, 3, 2); ctx.fill();

  if (!open) {
    rr(ctx, sx - 4.5, sy - h * 0.45, 9, 10, 2); ctx.fill();
    ctx.fillStyle = shade('#f4c430', -0.22);
    ctx.beginPath(); ctx.arc(sx, sy - h * 0.18, 3, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawBush(ctx, sx, sy, T) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(sx + T * 0.06, sy + T * 0.33, T * 0.34, T * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#469450';
  ctx.beginPath(); ctx.arc(sx, sy, T * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#58ad62';
  ctx.beginPath(); ctx.arc(sx - T * 0.14, sy - T * 0.1, T * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx + T * 0.13, sy - T * 0.08, T * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.arc(sx - T * 0.1, sy - T * 0.12, T * 0.1, 0, Math.PI * 2); ctx.fill();
}

export function drawBench(ctx, sx, sy, T) {
  const u = T / 26;
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 4 * u, 5 * u, 1.2 * u, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5a30';
  ctx.fillRect(sx - 4.5 * u, sy, 1.2 * u, 3.5 * u);
  ctx.fillRect(sx + 3.3 * u, sy, 1.2 * u, 3.5 * u);
  ctx.fillStyle = '#c4944a';
  rr(ctx, sx - 5 * u, sy - 2.5 * u, 10 * u, 2 * u, 1); ctx.fill();
  ctx.fillStyle = '#b58438';
  rr(ctx, sx - 5 * u, sy - 6 * u, 10 * u, 1.5 * u, 1); ctx.fill();
  ctx.fillRect(sx - 3.5 * u, sy - 6 * u, 1 * u, 3.5 * u);
  ctx.fillRect(sx + 2.5 * u, sy - 6 * u, 1 * u, 3.5 * u);
}

export function drawLamp(ctx, sx, sy, T) {
  const u = T / 26;
  ctx.fillStyle = '#555';
  ctx.fillRect(sx - 1.2 * u, sy - 8 * u, 1.8 * u, 12 * u);
  rr(ctx, sx - 2.5 * u, sy + 3.5 * u, 5 * u, 2 * u, 1); ctx.fill();
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1.2 * u;
  ctx.beginPath(); ctx.moveTo(sx, sy - 8 * u); ctx.lineTo(sx + 4 * u, sy - 8 * u); ctx.stroke();
  ctx.fillStyle = '#ffe08a';
  ctx.beginPath(); ctx.ellipse(sx + 4 * u, sy - 7.5 * u, 2 * u, 1.5 * u, 0, 0, Math.PI * 2); ctx.fill();
  const gl = ctx.createRadialGradient(sx + 4 * u, sy - 7.5 * u, 0, sx + 4 * u, sy - 7.5 * u, 5 * u);
  gl.addColorStop(0, 'rgba(255,220,100,0.35)'); gl.addColorStop(1, 'rgba(255,220,100,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sx + 4 * u, sy - 7.5 * u, 5 * u, 0, Math.PI * 2); ctx.fill();
}

export function drawMonument(ctx, sx, sy, T, type, pulse) {
  const u = T / 26;
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 6 * u, 6 * u, 1.8 * u, 0, 0, Math.PI * 2); ctx.fill();

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
function shade(hex, amt) {
  const c = hex.replace('#', '');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
  return `rgb(${r},${g},${b})`;
}
