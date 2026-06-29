// ============================================================
//  SRS-движок — упрощённый SM-2 (как в Anki, но мягче)
//  Состояние карточки: { reps, ease, interval, due, lapses, seen }
//  Оценки: 'again' | 'hard' | 'good' | 'easy'
// ============================================================

export const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

export function newState() {
  return {
    reps: 0,        // успешных повторов подряд
    ease: 2.5,      // лёгкость
    interval: 0,    // текущий интервал в днях (0 = учится)
    due: 0,         // когда показать снова (timestamp)
    lapses: 0,      // сколько раз забыл
    seen: false,    // показывали ли хоть раз
  };
}

// Слово считается «освоенным» (достраивает город), когда выпустилось
// из фазы заучивания: 2+ успешных повтора подряд.
export function isMastered(st) {
  return st.reps >= 2 && st.interval >= 1;
}

export function isNew(st) {
  return !st.seen;
}

// Готова ли карточка к показу прямо сейчас
export function isDue(st, now) {
  return st.seen && st.due <= now;
}

// Применить оценку и вернуть НОВОЕ состояние (+ сколько монет/опыта дать)
export function grade(prev, rating, now) {
  const st = { ...prev, seen: true };
  let coins = 0;
  let xp = 0;

  switch (rating) {
    case 'again': {
      st.reps = 0;
      st.lapses += 1;
      st.ease = Math.max(1.3, st.ease - 0.2);
      st.interval = 0;
      st.due = now + 1 * MIN;          // вернётся в этой же сессии
      coins = 0; xp = 1;
      break;
    }
    case 'hard': {
      st.ease = Math.max(1.3, st.ease - 0.15);
      st.interval = st.interval < 1 ? 1 : Math.max(1, Math.round(st.interval * 1.2));
      st.reps += 1;
      st.due = now + st.interval * DAY;
      coins = 1; xp = 3;
      break;
    }
    case 'good': {
      if (st.reps === 0) st.interval = 1;
      else if (st.reps === 1) st.interval = 3;
      else st.interval = Math.round(st.interval * st.ease);
      st.reps += 1;
      st.due = now + st.interval * DAY;
      coins = 2; xp = 5;
      break;
    }
    case 'easy': {
      st.ease = Math.min(3.0, st.ease + 0.15);
      if (st.reps === 0) st.interval = 2;
      else st.interval = Math.round(st.interval * st.ease * 1.3);
      st.reps += 1;
      st.due = now + st.interval * DAY;
      coins = 3; xp = 7;
      break;
    }
  }
  return { st, coins, xp };
}

// человекочитаемый «следующий показ»
export function nextLabel(prev, rating, now) {
  const { st } = grade(prev, rating, now);
  if (st.interval < 1) return '< 1 мин';
  if (st.interval === 1) return '1 день';
  if (st.interval < 30) return `${st.interval} дн.`;
  const months = Math.round(st.interval / 30);
  return `${months} мес.`;
}
