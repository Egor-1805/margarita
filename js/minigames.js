// ============================================================
//  Мини-игры (DOM-модалки): знакомство, пары, мемори, картинка,
//  аудирование, ввод, диалоги. Возвращают Promise с результатом.
// ============================================================
import { getCards, bare } from './locations.js';
import * as store from './store.js';
import * as srs from './srs.js';
import { speak } from './audio.js';

const SR_LANGS = { es: 'es-ES', en: 'en-US', de: 'de-DE' };
const WRITE_LABELS = { es: 'по-испански', en: 'по-английски', de: 'по-немецки' };
const getLang = () => store.getGame().lang || 'es';

const norm = (s) => s.toLowerCase().trim().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,…]/g, '').replace(/\s+/g, ' ').trim();
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
const elFrom = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };

function gradeCard(card, correct) {
  const st = store.getCardState(card.id);
  const wasNew = !st.seen;
  const { st: ns, coins, xp } = srs.grade(st, correct ? 'good' : 'again', Date.now());
  store.setCardState(card.id, ns);
  let c = coins;
  const g = store.getGame();
  if (c > 0 && g.boosts.doubleLeft > 0) { c *= 2; g.boosts.doubleLeft -= 1; }
  store.addRewards(c, xp);
  if (wasNew) g.todayNew += 1;
  store.save();
  return c;
}

function distractors(card, field, n = 3) {
  const CARDS = getCards();
  const sameRegion = CARDS.filter(c => c.region === card.region && c[field] !== card[field]);
  const similar = sameRegion.filter(c => Math.abs((c[field] || '').length - (card[field] || '').length) <= 5);
  const pool = similar.length >= n ? similar : sameRegion;
  const opts = [];
  for (const c of shuffle(pool)) {
    if (opts.length >= n) break;
    if (!opts.includes(c[field])) opts.push(c[field]);
  }
  while (opts.length < n) {
    const c = CARDS[(Math.random() * CARDS.length) | 0];
    if (c[field] !== card[field] && !opts.includes(c[field])) opts.push(c[field]);
  }
  return opts;
}

// модалка с шапкой (прогресс + закрыть). onClose резолвит игру досрочно.
function modal(title) {
  const overlay = elFrom(`<div class="mg-overlay"><div class="mg-card">
    <div class="mg-top"><button class="mg-x">✕</button><div class="mg-title">${title}</div><div class="mg-prog"></div></div>
    <div class="mg-body"></div>
  </div></div>`);
  document.body.appendChild(overlay);
  const body = overlay.querySelector('.mg-body');
  const prog = overlay.querySelector('.mg-prog');
  let aborted = false, abortCb = null;
  overlay.querySelector('.mg-x').onclick = () => { aborted = true; abortCb && abortCb(); };
  return {
    body, setProg: (t) => prog.textContent = t,
    set onAbort(cb) { abortCb = cb; }, get aborted() { return aborted; },
    speakBtn: (text) => `<button class="mg-speak" data-say="${encodeURIComponent(text)}">🔊</button>`,
    wireSpeak: () => body.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(decodeURIComponent(b.dataset.say))),
    close: () => overlay.remove(),
  };
}

// ---------- знакомство с новыми словами ----------
export function runIntro(cards) {
  return new Promise((resolve) => {
    if (!cards.length) return resolve();
    const m = modal('Новые слова');
    let i = 0;
    m.onAbort = () => { m.close(); resolve(); };
    const show = () => {
      const c = cards[i];
      m.setProg(`${i + 1}/${cards.length}`);
      m.body.replaceChildren(elFrom(`<div class="mg-intro">
        <div class="mg-badge">Новое слово</div>
        <div class="mg-es">${c.es} ${m.speakBtn(c.es)}</div>
        <div class="mg-emoji">${c.emoji}</div>
        <div class="mg-ru">${c.ru}</div>
        <div class="mg-ex"><span>${c.exEs}</span><em>${c.exRu}</em></div>
        <button class="mg-btn" id="mgNext">${i < cards.length - 1 ? 'Дальше →' : 'Поехали!'}</button>
      </div>`));
      m.wireSpeak();
      setTimeout(() => speak(c.es), 200);
      m.body.querySelector('#mgNext').onclick = () => { i++; (i < cards.length && !m.aborted) ? show() : (m.close(), resolve()); };
    };
    show();
  });
}

// ---------- выбрать формат ----------
export function runGame(type, cards) {
  if (type === 'match') return runMatch(cards.slice(0, 5));
  if (type === 'memory') return runMemory(cards.slice(0, 6));
  if (type === 'scramble') return runScramble(cards.slice(0, 5));
  if (type === 'phrase') return runPhrase(cards.slice(0, 4));
  if (type === 'speak') return runSpeak(cards.slice(0, 5));
  return runQuiz(cards.slice(0, 6), type); // picture | listen | type | complete | translate
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function maskSentence(c) {
  const word = bare(c.es).split(' ')[0];
  if (!word || word.length < 2) return null;
  const re = new RegExp('\\b' + escapeRe(word) + '[a-zäöüáéíóúüñß]*\\b', 'i');
  const m = c.exEs.match(re);
  if (!m) return null;
  return { masked: c.exEs.replace(m[0], '<span class="mg-blank">___</span>'), answer: m[0] };
}

// ---------- пары (РУ ↔ ИСП) ----------
function runMatch(cards) {
  return new Promise((resolve) => {
    const m = modal('Найди пары');
    m.setProg(`0/${cards.length}`);
    let matched = 0, coins = 0, pickedLeft = null;
    const wrong = {};
    m.onAbort = () => { m.close(); resolve({ correct: matched, total: cards.length, coins }); };
    const left = shuffle(cards), right = shuffle(cards);
    m.body.replaceChildren(elFrom(`<div class="mg-match">
      <div class="mg-col" data-side="l">${left.map(c => `<button class="mg-pair" data-id="${c.id}">${c.ru}</button>`).join('')}</div>
      <div class="mg-col" data-side="r">${right.map(c => `<button class="mg-pair es" data-id="${c.id}">${c.es}</button>`).join('')}</div>
    </div>`));
    const btns = [...m.body.querySelectorAll('.mg-pair')];
    const sel = (btn) => {
      if (btn.classList.contains('done')) return;
      const side = btn.parentElement.dataset.side;
      if (side === 'l') {
        btns.forEach(b => b.parentElement.dataset.side === 'l' && b.classList.remove('sel'));
        pickedLeft = btn; btn.classList.add('sel');
        return;
      }
      if (!pickedLeft) return;
      const id = pickedLeft.dataset.id;
      if (btn.dataset.id === id) {
        speak(cards.find(c => c.id === id).es);
        pickedLeft.classList.remove('sel'); pickedLeft.classList.add('done'); btn.classList.add('done');
        const card = cards.find(c => c.id === id);
        coins += gradeCard(card, !wrong[id]);
        matched++; m.setProg(`${matched}/${cards.length}`);
        pickedLeft = null;
        if (matched === cards.length) setTimeout(() => { m.close(); resolve({ correct: matched, total: cards.length, coins }); }, 350);
      } else {
        wrong[id] = true; btn.classList.add('bad'); pickedLeft.classList.add('bad');
        const pl = pickedLeft;
        setTimeout(() => { btn.classList.remove('bad'); pl.classList.remove('bad', 'sel'); }, 450);
        pickedLeft = null;
      }
    };
    btns.forEach(b => b.onclick = () => sel(b));
  });
}

// ---------- мемори (переворот карточек) ----------
function runMemory(cards) {
  return new Promise((resolve) => {
    const m = modal('Мемори');
    let matched = 0, coins = 0, flipped = [], lock = false;
    const wrong = {};
    m.onAbort = () => { m.close(); resolve({ correct: matched, total: cards.length, coins }); };
    const tiles = shuffle([
      ...cards.map(c => ({ id: c.id, face: c.es, kind: 'es' })),
      ...cards.map(c => ({ id: c.id, face: c.ru, kind: 'ru' })),
    ]);
    m.setProg(`0/${cards.length}`);
    m.body.replaceChildren(elFrom(`<div class="mg-memory">${tiles.map((t, i) =>
      `<button class="mg-tile" data-i="${i}" data-id="${t.id}"><span class="mg-tile-back">?</span><span class="mg-tile-face">${t.face}</span></button>`).join('')}</div>`));
    const btns = [...m.body.querySelectorAll('.mg-tile')];
    btns.forEach((b, i) => b.onclick = () => {
      if (lock || b.classList.contains('open') || b.classList.contains('done')) return;
      b.classList.add('open'); flipped.push(b);
      const t = tiles[i]; if (t.kind === 'es') speak(t.face);
      if (flipped.length === 2) {
        lock = true;
        const [a, c] = flipped;
        if (a.dataset.id === c.dataset.id) {
          setTimeout(() => {
            a.classList.add('done'); c.classList.add('done'); flipped = []; lock = false;
            const card = cards.find(x => x.id === a.dataset.id);
            coins += gradeCard(card, !wrong[a.dataset.id]);
            matched++; m.setProg(`${matched}/${cards.length}`);
            if (matched === cards.length) setTimeout(() => { m.close(); resolve({ correct: matched, total: cards.length, coins }); }, 300);
          }, 400);
        } else {
          wrong[a.dataset.id] = true; wrong[c.dataset.id] = true;
          setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); flipped = []; lock = false; }, 750);
        }
      }
    });
  });
}

// ---------- квиз с вариантами: картинка / аудио / ввод / перевод / продолжи фразу ----------
function runQuiz(cards, mode) {
  return new Promise((resolve) => {
    const titles = { picture: 'Картинка и слово', listen: 'Аудирование', type: 'Напиши слово', translate: 'Переведи фразу', complete: 'Закончи предложение' };
    const m = modal(titles[mode] || 'Задание');
    let i = 0, correct = 0, coins = 0;
    m.onAbort = () => { m.close(); resolve({ correct, total: cards.length, coins }); };
    const step = () => {
      if (i >= cards.length) { m.close(); return resolve({ correct, total: cards.length, coins }); }
      const c = cards[i]; m.setProg(`${i + 1}/${cards.length}`);
      if (mode === 'type') return stepType(c);

      // вычисляем вопрос/ответ/варианты под режим
      let head, answer, opts, sayEs = c.es, doSpeak = false;
      if (mode === 'picture') {
        head = `<div class="mg-emoji">${c.emoji}</div><div class="mg-q">Какое это слово?</div>`;
        answer = c.es; opts = shuffle([c.es, ...distractors(c, 'es')]);
      } else if (mode === 'listen') {
        head = `<button class="mg-btn ghost" id="mgReplay">🔊 Послушать ещё</button><div class="mg-q">Что ты услышал(а)?</div>`;
        answer = c.ru; opts = shuffle([c.ru, ...distractors(c, 'ru')]); doSpeak = true;
      } else if (mode === 'translate') {
        head = `<div class="mg-sent">${c.exEs} ${m.speakBtn(c.exEs)}</div><div class="mg-q">Что это значит?</div>`;
        answer = c.exRu; opts = shuffle([c.exRu, ...distractors(c, 'exRu')]); sayEs = c.exEs; doSpeak = true;
      } else { // complete
        const mk = maskSentence(c);
        if (!mk) { // нет слова в примере — заменим на перевод-задание
          head = `<div class="mg-sent">${c.exEs} ${m.speakBtn(c.exEs)}</div><div class="mg-q">Что это значит?</div>`;
          answer = c.exRu; opts = shuffle([c.exRu, ...distractors(c, 'exRu')]); sayEs = c.exEs;
        } else {
          head = `<div class="mg-sent">${mk.masked}</div><div class="mg-ru sm">${c.exRu}</div><div class="mg-q">Какое слово пропущено?</div>`;
          answer = mk.answer;
          const wrong = shuffle(distractors(c, 'es')).slice(0, 3).map(w => bare(w).split(' ')[0]);
          opts = shuffle([answer, ...new Set(wrong)]).slice(0, 4);
          if (!opts.includes(answer)) opts[0] = answer;
          sayEs = c.exEs;
        }
      }
      m.body.replaceChildren(elFrom(`<div class="mg-quiz">${head}
        <div class="mg-opts">${opts.map(o => `<button class="mg-opt" data-v="${encodeURIComponent(o)}">${o}</button>`).join('')}</div></div>`));
      m.wireSpeak();
      if (doSpeak) setTimeout(() => speak(sayEs), 150);
      if (mode === 'listen') m.body.querySelector('#mgReplay').onclick = () => speak(c.es);
      m.body.querySelectorAll('.mg-opt').forEach(b => b.onclick = () => {
        const ok = decodeURIComponent(b.dataset.v) === answer;
        m.body.querySelectorAll('.mg-opt').forEach(x => { x.disabled = true; if (decodeURIComponent(x.dataset.v) === answer) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        speak(sayEs);
        if (ok) correct++;
        coins += gradeCard(c, ok);
        i++; setTimeout(step, ok ? 700 : 1050);
      });
    };
    const stepType = (c) => {
      const hintOn = store.getGame().boosts.hint;
      const hint = hintOn ? `<div class="mg-hint">💡 ${c.es[0]}${'•'.repeat(Math.max(0, c.es.replace(/\s/g, '').length - 1))}</div>` : '';
      m.body.replaceChildren(elFrom(`<div class="mg-quiz">
        <div class="mg-emoji">${c.emoji}</div><div class="mg-ru">${c.ru}</div>
        <div class="mg-q">Напиши ${WRITE_LABELS[getLang()] || 'по-испански'}</div>${hint}
        <input class="mg-input" id="mgIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="escribe…">
        <button class="mg-btn" id="mgCheck">Проверить</button>
        <div class="mg-fb" id="mgFb"></div></div>`));
      const inp = m.body.querySelector('#mgIn'); setTimeout(() => inp.focus(), 60);
      const accept = new Set([norm(c.es), norm(c.es.replace(/^(el |la |los |las )/, ''))]);
      const check = () => {
        const ok = accept.has(norm(inp.value)); if (!inp.value.trim()) return;
        inp.disabled = true; m.body.querySelector('#mgCheck').remove();
        m.body.querySelector('#mgFb').innerHTML = ok ? `<div class="fb ok">✓ ¡Correcto! <b>${c.es}</b></div>`
          : `<div class="fb no">Правильно: <b>${c.es}</b><br><small>🔁 покажу ещё раз</small></div>`;
        speak(c.es); if (ok) correct++; coins += gradeCard(c, ok);
        const nx = elFrom(`<button class="mg-btn" id="mgNx">Дальше →</button>`); m.body.querySelector('.mg-quiz').appendChild(nx);
        nx.onclick = () => { i++; step(); };
      };
      m.body.querySelector('#mgCheck').onclick = check;
      inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.disabled ? m.body.querySelector('#mgNx')?.click() : check(); } };
    };
    step();
  });
}

// ---------- собери слово (анаграмма) ----------
function runScramble(cards) {
  return new Promise((resolve) => {
    const m = modal('Собери слово'); let i = 0, correct = 0, coins = 0;
    m.onAbort = () => { m.close(); resolve({ correct, total: cards.length, coins }); };
    const step = () => {
      if (i >= cards.length) { m.close(); return resolve({ correct, total: cards.length, coins }); }
      const c = cards[i]; m.setProg(`${i + 1}/${cards.length}`);
      const target = bare(c.es).toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
      const letters = shuffle(target.split(''));
      m.body.replaceChildren(elFrom(`<div class="mg-quiz">
        <div class="mg-emoji">${c.emoji}</div><div class="mg-ru">${c.ru}</div>
        <div class="mg-q">Собери слово по-испански</div>
        <div class="mg-build" id="mgBuild"></div>
        <div class="mg-letters">${letters.map((l, j) => `<button class="mg-letter" data-j="${j}">${l}</button>`).join('')}</div>
        <div class="mg-fb" id="mgFb"></div></div>`));
      const build = m.body.querySelector('#mgBuild'); const assembled = [];
      const refresh = () => build.textContent = assembled.map(a => a.l).join('');
      const finish = () => {
        const ok = assembled.map(a => a.l).join('') === target;
        m.body.querySelectorAll('.mg-letter').forEach(x => x.disabled = true);
        m.body.querySelector('#mgFb').innerHTML = ok ? `<div class="fb ok">✓ <b>${c.es}</b></div>` : `<div class="fb no">Правильно: <b>${c.es}</b></div>`;
        speak(c.es); if (ok) correct++; coins += gradeCard(c, ok);
        const nx = elFrom(`<button class="mg-btn" id="mgNx">Дальше →</button>`); m.body.querySelector('.mg-quiz').appendChild(nx);
        nx.onclick = () => { i++; step(); };
      };
      m.body.querySelectorAll('.mg-letter').forEach(btn => btn.onclick = () => {
        if (btn.classList.contains('used')) return;
        btn.classList.add('used'); assembled.push({ l: btn.textContent, btn }); refresh();
        if (assembled.length === target.length) finish();
      });
      build.onclick = () => { const last = assembled.pop(); if (last) { last.btn.classList.remove('used'); refresh(); } };
    };
    step();
  });
}

// ---------- собери фразу (порядок слов) ----------
function runPhrase(cards) {
  return new Promise((resolve) => {
    const m = modal('Собери фразу'); let i = 0, correct = 0, coins = 0;
    m.onAbort = () => { m.close(); resolve({ correct, total: cards.length, coins }); };
    const step = () => {
      if (i >= cards.length) { m.close(); return resolve({ correct, total: cards.length, coins }); }
      const c = cards[i]; m.setProg(`${i + 1}/${cards.length}`);
      const words = c.exEs.replace(/[¿?¡!.,]/g, '').trim().split(/\s+/);
      const shuffled = shuffle(words.map((w, j) => ({ w, j })));
      m.body.replaceChildren(elFrom(`<div class="mg-quiz">
        <div class="mg-ru">${c.exRu}</div><div class="mg-q">Собери фразу по-испански</div>
        <div class="mg-build phrase" id="mgBuild"></div>
        <div class="mg-words">${shuffled.map((o, k) => `<button class="mg-word" data-k="${k}">${o.w}</button>`).join('')}</div>
        <div class="mg-fb" id="mgFb"></div></div>`));
      const build = m.body.querySelector('#mgBuild'); const assembled = [];
      const refresh = () => build.textContent = assembled.map(a => a.w).join(' ');
      const finish = () => {
        const ok = assembled.map(a => a.w).join(' ').toLowerCase() === words.join(' ').toLowerCase();
        m.body.querySelectorAll('.mg-word').forEach(x => x.disabled = true);
        m.body.querySelector('#mgFb').innerHTML = ok ? `<div class="fb ok">✓ <b>${c.exEs}</b></div>` : `<div class="fb no">Правильно: <b>${c.exEs}</b></div>`;
        speak(c.exEs); if (ok) correct++; coins += gradeCard(c, ok);
        const nx = elFrom(`<button class="mg-btn" id="mgNx">Дальше →</button>`); m.body.querySelector('.mg-quiz').appendChild(nx);
        nx.onclick = () => { i++; step(); };
      };
      m.body.querySelectorAll('.mg-word').forEach(btn => btn.onclick = () => {
        if (btn.classList.contains('used')) return;
        btn.classList.add('used'); assembled.push({ w: btn.textContent, btn }); refresh();
        if (assembled.length === words.length) finish();
      });
      build.onclick = () => { const last = assembled.pop(); if (last) { last.btn.classList.remove('used'); refresh(); } };
    };
    step();
  });
}

// ---------- произнеси (с распознаванием речи, где есть) ----------
function runSpeak(cards) {
  return new Promise((resolve) => {
    const m = modal('Произнеси'); let i = 0, correct = 0, coins = 0;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    m.onAbort = () => { m.close(); resolve({ correct, total: cards.length, coins }); };
    const step = () => {
      if (i >= cards.length) { m.close(); return resolve({ correct, total: cards.length, coins }); }
      const c = cards[i]; m.setProg(`${i + 1}/${cards.length}`);
      m.body.replaceChildren(elFrom(`<div class="mg-quiz">
        <div class="mg-q">Произнеси вслух:</div>
        <div class="mg-es">${c.es} ${m.speakBtn(c.es)}</div>
        <div class="mg-emoji">${c.emoji}</div><div class="mg-ru sm">${c.ru}</div>
        ${SR ? `<button class="mg-btn" id="mgMic">🎤 Сказать</button>` : `<button class="mg-btn" id="mgOk">✓ Повторил(а) вслух</button>`}
        <div class="mg-fb" id="mgFb"></div></div>`));
      m.wireSpeak(); setTimeout(() => speak(c.es), 250);
      const done = (ok) => { if (ok) correct++; coins += gradeCard(c, ok); const nx = elFrom(`<button class="mg-btn" id="mgNx">Дальше →</button>`); m.body.querySelector('.mg-quiz').appendChild(nx); nx.onclick = () => { i++; step(); }; };
      if (SR) {
        m.body.querySelector('#mgMic').onclick = () => {
          const rec = new SR(); rec.lang = SR_LANGS[getLang()] || 'es-ES'; rec.interimResults = false; rec.maxAlternatives = 3;
          const mic = m.body.querySelector('#mgMic'); mic.textContent = '🎙️ Слушаю…'; mic.disabled = true;
          rec.onresult = (e) => {
            const said = norm([...e.results[0]].map(a => a.transcript).join(' '));
            const tgt = norm(bare(c.es));
            const ok = said.includes(tgt) || tgt.includes(said) || levClose(said, tgt);
            m.body.querySelector('#mgFb').innerHTML = ok ? `<div class="fb ok">✓ ¡Bien dicho!</div>` : `<div class="fb no">Услышал: «${e.results[0][0].transcript}»<br>Правильно: <b>${c.es}</b></div>`;
            mic.remove(); done(ok);
          };
          rec.onerror = () => { m.body.querySelector('#mgFb').innerHTML = `<div class="fb no">Микрофон недоступен — повтори вслух и жми «Дальше».</div>`; mic.remove(); done(true); };
          try { rec.start(); } catch (e) { mic.remove(); done(true); }
        };
      } else {
        m.body.querySelector('#mgOk').onclick = () => { m.body.querySelector('#mgOk').remove(); done(true); };
      }
    };
    step();
  });
}
function levClose(a, b) { if (Math.abs(a.length - b.length) > 2) return false; let d = 0; for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) d++; return d <= 2; }

// ---------- диалог с прохожим (генерируется в locations.makeDialogue) ----------
export function runDialogue(dlg) {
  return new Promise((resolve) => {
    const m = modal('Диалог'); m.setProg('');
    m.onAbort = () => { m.close(); resolve({ correct: false, coins: 0 }); };
    const optsHTML = dlg.options.map(o => `<button class="mg-opt" data-v="${encodeURIComponent(o)}">${o}</button>`).join('');
    const youLine = dlg.kind === 'fill'
      ? `<div class="mg-q">Ответь: <b>${dlg.youEs.replace('___', '<span class="mg-blank">___</span>')}</b><br><span class="mg-ru sm">${dlg.youRu}</span></div>`
      : `<div class="mg-q">Что ответишь?</div>`;
    m.body.replaceChildren(elFrom(`<div class="mg-quiz">
      <div class="mg-npc">🧑</div>
      <div class="mg-bubble">${dlg.npcEs} ${m.speakBtn(dlg.npcEs)}<em>${dlg.npcRu}</em></div>
      ${youLine}
      <div class="mg-opts">${optsHTML}</div></div>`));
    m.wireSpeak();
    setTimeout(() => speak(dlg.npcEs), 200);
    m.body.querySelectorAll('.mg-opt').forEach(b => b.onclick = () => {
      const ok = decodeURIComponent(b.dataset.v) === dlg.answer;
      m.body.querySelectorAll('.mg-opt').forEach(x => { x.disabled = true; if (decodeURIComponent(x.dataset.v) === dlg.answer) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      const speakFull = dlg.kind === 'fill' ? dlg.youEs.replace('___', dlg.answer) : dlg.answer;
      speak(speakFull);
      let coins;
      if (dlg.card) coins = gradeCard(dlg.card, ok) + (ok ? 2 : 0);
      else { coins = ok ? 4 : 1; store.addRewards(coins, ok ? 4 : 1); store.save(); }
      setTimeout(() => { m.close(); resolve({ correct: ok, coins }); }, ok ? 1000 : 1300);
    });
  });
}
