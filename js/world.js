// ============================================================
//  Движок открытого мира (вид сверху, canvas)
// ============================================================
import { LOCATIONS, MAP_W, MAP_H, PLAZA, doorTile, NPC_SPOTS, CHEST_SPOTS, PATHS, TREE_SPOTS, BUSH_SPOTS, BENCH_SPOTS, LAMP_SPOTS, MONUMENT_SPOTS } from './locations.js';
import * as S from './sprites.js';
import * as store from './store.js';

const NPC_PALETTES = [
  { skin: '#f1c9a5', hair: '#3a2a20', shirt: '#4d908e' },
  { skin: '#e8b48c', hair: '#5a3b22', shirt: '#e76f51' },
  { skin: '#f3d1b0', hair: '#2b2620', shirt: '#3a6ea5' },
  { skin: '#d99a6c', hair: '#1f1a16', shirt: '#f4a259' },
  { skin: '#f1c9a5', hair: '#7b5ea7', shirt: '#7b5ea7' },
  { skin: '#e8b48c', hair: '#b5532a', shirt: '#577590' },
];

export function createWorld(canvas, look, handlers) {
  const ctx = canvas.getContext('2d');
  let T = 38, vw = 0, vh = 0, raf = 0, last = 0;
  const state = {
    px: PLAZA.x, py: PLAZA.y + 1.4,  // позиция в тайлах (ниже фонтана)
    phase: 0, moving: false,
    cam: { x: 0, y: 0 },
    joy: { x: 0, y: 0, active: false }, keys: {},
    paused: false, nearby: null, look,
  };

  // здания → пиксельные прямоугольники + двери
  const buildings = LOCATIONS.map(loc => ({ loc, ...loc, door: doorTile(loc) }));

  // NPC разбросаны по карте
  const npcs = NPC_SPOTS.map((s, i) => ({
    x: s[0], y: s[1], phase: Math.random() * 6,
    pal: NPC_PALETTES[i % NPC_PALETTES.length],
  }));

  // Ая — секретный NPC, меняет место каждый день
  const AYA_SPOTS = [[6,5],[18,8],[32,12],[10,22],[38,18],[24,6],[14,28],[30,24],[8,16],[22,20]];
  const ayaIdx = Math.floor(Date.now() / 86400000) % AYA_SPOTS.length;
  const aya = { x: AYA_SPOTS[ayaIdx][0], y: AYA_SPOTS[ayaIdx][1], phase: 0,
    pal: { skin: '#f5c6d8', hair: '#7a4520', shirt: '#ff80b3' } };

  // сундуки
  const chests = CHEST_SPOTS.map(c => ({ ...c }));

  // декор — фиксированные позиции
  const decor = [
    ...TREE_SPOTS.map(([x, y]) => ({ x, y, type: 'tree' })),
    ...BUSH_SPOTS.map(([x, y]) => ({ x, y, type: 'bush' })),
    ...BENCH_SPOTS.map(b => ({ ...b, type: 'bench' })),
    ...LAMP_SPOTS.map(([x, y]) => ({ x, y, type: 'lamp' })),
  ].sort((a, b) => a.y - b.y);

  // памятники (интерактивные)
  const monuments = MONUMENT_SPOTS.map(m => ({ ...m }));

  const paths = PATHS;

  function insideAnyBuilding(tx, ty, pad = 0) {
    return buildings.some(b => tx > b.tx - pad && tx < b.tx + b.w + pad && ty > b.ty - pad && ty < b.ty + b.h + pad);
  }

  // ---------- размер ----------
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = r.width; vh = r.height;
    canvas.width = vw * dpr; canvas.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    T = Math.max(30, Math.min(52, vw / 11));
  }

  // ---------- движение ----------
  function dirInput() {
    let dx = 0, dy = 0;
    if (state.joy.active) { dx = state.joy.x; dy = state.joy.y; }
    else {
      if (state.keys['ArrowLeft'] || state.keys['a']) dx -= 1;
      if (state.keys['ArrowRight'] || state.keys['d']) dx += 1;
      if (state.keys['ArrowUp'] || state.keys['w']) dy -= 1;
      if (state.keys['ArrowDown'] || state.keys['s']) dy += 1;
    }
    if (dx || dy) { const m = Math.hypot(dx, dy) || 1; return { x: dx / m, y: dy / m }; }
    return { x: 0, y: 0 };
  }

  function collides(tx, ty) {
    const r = 0.32;
    if (tx < 0.4 || ty < 0.4 || tx > MAP_W - 0.4 || ty > MAP_H - 0.4) return true;
    for (const b of buildings) {
      // дверной проём (снизу по центру) проходим
      if (tx > b.tx - r && tx < b.tx + b.w + r && ty > b.ty - r && ty < b.ty + b.h + r) return true;
    }
    return false;
  }

  function update(dt) {
    const dir = dirInput();
    const speed = 5.4; // тайлов/сек
    state.moving = !!(dir.x || dir.y);
    if (state.moving) {
      const nx = state.px + dir.x * speed * dt;
      const ny = state.py + dir.y * speed * dt;
      if (!collides(nx, state.py)) state.px = nx;
      if (!collides(state.px, ny)) state.py = ny;
      state.phase += dt * 11;
    }
    // NPC лёгкое покачивание
    for (const n of npcs) n.phase += dt * 2;
    aya.phase += dt * 2;

    // камера
    const cx = state.px * T - vw / 2, cy = state.py * T - vh / 2;
    const maxX = Math.max(0, MAP_W * T - vw), maxY = Math.max(0, MAP_H * T - vh);
    state.cam.x = clamp(cx, 0, maxX); state.cam.y = clamp(cy, 0, maxY);
    if (MAP_W * T < vw) state.cam.x = (MAP_W * T - vw) / 2;
    if (MAP_H * T < vh) state.cam.y = (MAP_H * T - vh) / 2;

    // ближайший интерактив
    let best = null, bestD = 1.2;
    for (const b of buildings) {
      const d = Math.hypot(state.px - b.door.x, state.py - b.door.y);
      if (d < bestD) { bestD = d; best = { type: 'location', ref: b.loc, label: '🚪 ' + b.loc.name }; }
    }
    for (const n of npcs) {
      const d = Math.hypot(state.px - n.x, state.py - n.y - 0.3);
      if (d < bestD) { bestD = d; best = { type: 'npc', ref: n, label: '💬 Поговорить' }; }
    }
    for (const c of chests) {
      if (!c.secret && handlers.isChestOpen && handlers.isChestOpen(c.id)) continue;
      if (c.secret && store.getGame().devChestOpened) continue;
      const d = Math.hypot(state.px - c.x, state.py - c.y);
      if (d < bestD) {
        bestD = d;
        best = { type: 'chest', ref: c, label: c.secret ? '🔒 ???' : '🎁 Открыть сундук' };
      }
    }
    for (const mon of monuments) {
      const d = Math.hypot(state.px - mon.x, state.py - mon.y);
      if (d < bestD) { bestD = d; best = { type: 'monument', ref: mon, label: mon.label }; }
    }
    const da = Math.hypot(state.px - aya.x, state.py - aya.y - 0.3);
    if (da < bestD) { bestD = da; best = { type: 'aya', ref: aya, label: '🌸 Aya' }; }
    if ((best && best.ref) !== (state.nearby && state.nearby.ref)) {
      state.nearby = best;
      handlers.onNearby && handlers.onNearby(best);
    }
  }

  // ---------- рендер ----------
  function render() {
    const cam = state.cam;
    const pulse = (Math.sin(performance.now() / 300) + 1) / 2;
    S.drawGround(ctx, cam, vw, vh, T);
    S.drawPaths(ctx, cam, T, paths, PLAZA);
    S.drawFountain(ctx, PLAZA.x * T - cam.x, PLAZA.y * T - cam.y, T);
    // декор (деревья, кусты, скамейки, фонари)
    for (const d of decor) {
      const sx = d.x * T - cam.x, sy = d.y * T - cam.y;
      if (sx < -T * 2 || sx > vw + T * 2 || sy < -T * 2 || sy > vh + T * 2) continue;
      if (d.type === 'tree') S.drawTree(ctx, sx, sy, T);
      else if (d.type === 'bush') S.drawBush(ctx, sx, sy, T);
      else if (d.type === 'bench') S.drawBench(ctx, sx, sy, T);
      else if (d.type === 'lamp') S.drawLamp(ctx, sx, sy, T);
    }
    // памятники
    for (const mon of monuments) {
      const sx = mon.x * T - cam.x, sy = mon.y * T - cam.y;
      if (sx < -T * 2 || sx > vw + T * 2 || sy < -T * 2 || sy > vh + T * 2) continue;
      S.drawMonument(ctx, sx, sy, T, mon.type, pulse);
    }
    // здания
    for (const b of buildings) {
      S.drawBuilding(ctx, b.tx * T - cam.x, b.ty * T - cam.y, b.w * T, b.h * T, b.loc, T);
    }
    // хот-споты у дверей
    for (const b of buildings) {
      S.drawHotspot(ctx, b.door.x * T - cam.x, b.door.y * T - cam.y, T, pulse);
    }
    // сундуки
    for (const c of chests) {
      const cx = c.x * T - cam.x, cy = c.y * T - cam.y;
      if (c.secret) {
        // секретный сундук — тёмный квадрат без свечения
        if (!store.getGame().devChestOpened) {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(cx - T * 0.18, cy - T * 0.18, T * 0.36, T * 0.36);
        }
      } else {
        const open = handlers.isChestOpen && handlers.isChestOpen(c.id);
        S.drawChest(ctx, cx, cy, T, open, pulse);
      }
    }
    // сущности по глубине
    const drawAya = () => {
      const ax = aya.x * T - cam.x, ay = aya.y * T - cam.y;
      S.drawNPC(ctx, ax, ay, T, aya.pal, aya.phase);
      ctx.save();
      const fs = Math.max(10, T * 0.28);
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textAlign = 'center';
      const ny = ay - T * 0.72;
      ctx.strokeStyle = '#7b3fa5'; ctx.lineWidth = 3; ctx.strokeText('Aya', ax, ny);
      ctx.fillStyle = '#fff'; ctx.fillText('Aya', ax, ny);
      ctx.restore();
    };
    const ents = [
      ...npcs.map(n => ({ y: n.y, draw: () => S.drawNPC(ctx, n.x * T - cam.x, n.y * T - cam.y, T, n.pal, n.phase) })),
      { y: aya.y, draw: drawAya },
      { y: state.py, draw: () => S.drawPerson(ctx, state.px * T - cam.x, state.py * T - cam.y, T, state.look, state.phase, state.moving) },
    ].sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw();
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (!state.paused) { update(dt); render(); }
  }

  // ---------- ввод ----------
  function onKey(e, down) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(k)) {
      state.keys[k] = down; e.preventDefault();
    }
    if (down && (k === ' ' || k === 'Enter') && state.nearby) interact();
  }
  const kd = e => onKey(e, true), ku = e => onKey(e, false);
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

  // джойстик — плавающий, появляется где коснулся
  function attachJoystick(base, nub) {
    const R = 48;
    let touchId = null, cx = 0, cy = 0, mouseActive = false;

    const isUIEl = (el) => el && (el.closest('#hud') || el.closest('#overlay') ||
      el.closest('.mg-overlay') || el.closest('#actionBtn'));

    const showAt = (clientX, clientY) => {
      cx = clientX; cy = clientY;
      base.style.left = clientX + 'px';
      base.style.top = clientY + 'px';
      base.style.opacity = '1';
      base.style.pointerEvents = 'auto';
    };
    const hideJoy = () => {
      base.style.opacity = '0';
      base.style.pointerEvents = 'none';
      nub.style.transform = 'translate(-50%,-50%)';
      state.joy.active = false; state.joy.x = state.joy.y = 0;
      touchId = null;
      mouseActive = false;
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) hideJoy(); });
    window.addEventListener('blur', hideJoy);
    const updateNub = (clientX, clientY) => {
      const dx = clientX - cx, dy = clientY - cy;
      const d = Math.hypot(dx, dy) || 1;
      const cl = Math.min(d, R);
      nub.style.transform = `translate(calc(-50% + ${(dx / d) * cl}px), calc(-50% + ${(dy / d) * cl}px))`;
      state.joy.x = (dx / Math.max(d, R)) * (d > 8 ? 1 : 0);
      state.joy.y = (dy / Math.max(d, R)) * (d > 8 ? 1 : 0);
    };

    document.addEventListener('touchstart', (e) => {
      if (state.paused || touchId !== null) return;
      const t = e.changedTouches[0];
      if (isUIEl(document.elementFromPoint(t.clientX, t.clientY))) return;
      touchId = t.identifier;
      showAt(t.clientX, t.clientY);
      state.joy.active = true;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!state.joy.active) return;
      const t = [...e.changedTouches].find(x => x.identifier === touchId);
      if (!t) return;
      updateNub(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });

    const onTouchEnd = (e) => {
      if ([...e.changedTouches].some(x => x.identifier === touchId)) { touchId = null; hideJoy(); }
    };
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);

    // мышь для десктопа
    document.addEventListener('mousedown', (e) => {
      if (state.paused || e.button !== 0) return;
      if (isUIEl(document.elementFromPoint(e.clientX, e.clientY))) return;
      mouseActive = true;
      showAt(e.clientX, e.clientY);
      state.joy.active = true;
    });
    document.addEventListener('mousemove', (e) => {
      if (!mouseActive || !state.joy.active) return;
      updateNub(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', () => { if (mouseActive) { mouseActive = false; hideJoy(); } });
  }

  function interact() {
    if (!state.nearby) return;
    const { type, ref } = state.nearby;
    if (type === 'location') handlers.onEnter && handlers.onEnter(ref);
    else if (type === 'npc') handlers.onTalk && handlers.onTalk(ref);
    else if (type === 'chest') handlers.onChest && handlers.onChest(ref);
    else if (type === 'aya') handlers.onAya && handlers.onAya();
    else if (type === 'monument') handlers.onMonument && handlers.onMonument(ref);
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---------- API ----------
  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(loop);

  return {
    attachJoystick,
    interact,
    getNearby: () => state.nearby,
    setLook: (l) => { state.look = l; },
    pause: () => { state.paused = true; },
    resume: () => { state.paused = false; last = performance.now(); state.joy.x = 0; state.joy.y = 0; state.joy.active = false; },
    destroy: () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', resize); },
  };
}
