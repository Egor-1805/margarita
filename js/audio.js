// ============================================================
//  Озвучка (Web Speech API) — мультиязычная, натуральный голос
// ============================================================
import * as store from './store.js';

let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

const LANG_CONFIG = {
  es: {
    bcp: 'es-ES',
    altBcp: ['es-', 'es'],
    female: ['mónica', 'monica', 'paulina', 'marisol', 'lucía', 'lucia', 'esperanza',
             'sabina', 'helena', 'laura', 'penélope', 'penelope', 'conchita', 'sara', 'elvira'],
    male: ['jorge', 'diego', 'carlos', 'enrique', 'pablo', 'juan', 'miguel', 'antonio'],
    preview: 'Hola, ¿cómo estás? Me alegra verte.',
  },
  en: {
    bcp: 'en-US',
    altBcp: ['en-'],
    female: ['samantha', 'victoria', 'karen', 'susan', 'zira', 'linda', 'jenny', 'aria',
             'zoe', 'siri', 'ava', 'allison', 'joanna', 'ivy', 'kendra', 'kimberly'],
    male: ['alex', 'tom', 'daniel', 'david', 'mark', 'james', 'guy', 'fred',
           'christopher', 'matthew', 'reed', 'ryan', 'oliver'],
    preview: 'Hello! How are you today? Nice to meet you.',
  },
  de: {
    bcp: 'de-DE',
    altBcp: ['de-'],
    female: ['anna', 'hedda', 'petra', 'katja', 'vicki', 'helga', 'ida', 'marlene', 'ingrid'],
    male: ['hans', 'stefan', 'markus', 'yannick', 'jan', 'michael', 'max', 'konrad', 'daniel'],
    preview: 'Hallo! Wie geht es Ihnen heute? Schön, Sie zu treffen.',
  },
};

// Параметры pitch/rate по полу — разница очень заметная
const VOICE_PARAMS = {
  female: { pitch: 1.15, rate: 0.90 },
  male:   { pitch: 0.72, rate: 0.85 },
};

function pickVoice(cfg, pref) {
  const byBcp = voices.filter(v => v.lang.toLowerCase().startsWith(cfg.bcp.toLowerCase().slice(0, 5)));
  const byAlt = voices.filter(v => cfg.altBcp.some(p => v.lang.toLowerCase().startsWith(p.toLowerCase())));
  let pool = byBcp.length ? byBcp : byAlt;

  // Если для языка вообще нет голосов — берём любой с нужным lang-префиксом
  if (!pool.length) {
    const langPrefix = cfg.bcp.slice(0, 2).toLowerCase();
    pool = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
  }
  if (!pool.length) return null;

  const nameList = pref === 'male' ? cfg.male : cfg.female;

  // 1. prefer neural / cloud voices (localService === false) with matching name
  const neural = pool.filter(v => v.localService === false);
  for (const n of nameList) {
    const v = neural.find(v => v.name.toLowerCase().includes(n));
    if (v) return v;
  }
  // 2. any neural voice for this language
  if (neural.length) return neural[0];

  // 3. local voice with matching name
  for (const n of nameList) {
    const v = pool.find(v => v.name.toLowerCase().includes(n));
    if (v) return v;
  }

  // 4. для male — пробуем исключить известные женские имена
  if (pref === 'male') {
    const femaleNames = cfg.female;
    const notFemale = pool.filter(v => !femaleNames.some(n => v.name.toLowerCase().includes(n)));
    if (notFemale.length) return notFemale[0];
  }

  return pool[0];
}

function buildUtterance(text, lang, cfg, pref) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = cfg.bcp;

  const v = pickVoice(cfg, pref);
  if (v) u.voice = v;

  // Всегда применяем pitch по полу — не зависим только от имени голоса
  const params = VOICE_PARAMS[pref] || VOICE_PARAMS.female;
  // Лёгкая вариативность rate для живого звучания
  const rateJitter = Math.random() * 0.06 - 0.03;
  u.pitch  = params.pitch;
  u.rate   = params.rate + rateJitter;
  u.volume = 1.0;

  return u;
}

export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const g = store.getGame();
  if (!g.settings.sound) return;
  try {
    speechSynthesis.cancel();
    const lang = g.lang || 'es';
    const cfg  = LANG_CONFIG[lang] || LANG_CONFIG.es;
    const pref = g.settings.voice || 'female';
    const u    = buildUtterance(text, lang, cfg, pref);
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

export function previewVoice() {
  if (!('speechSynthesis' in window)) return;
  try {
    const g    = store.getGame();
    const lang = g.lang || 'es';
    const cfg  = LANG_CONFIG[lang] || LANG_CONFIG.es;
    const pref = g.settings.voice || 'female';
    speechSynthesis.cancel();
    const u = buildUtterance(cfg.preview, lang, cfg, pref);
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
