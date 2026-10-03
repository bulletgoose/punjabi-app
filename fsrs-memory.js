// FSRS card state for the Word Game. The scheduler is the unmodified ts-fsrs 5.4.2
// release (MIT); only the game's answer-to-rating mapping lives here.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/ts-fsrs-5.4.2/index.umd.js'));
  else root.PunjabiMemory = factory(root.FSRS);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FSRS) {
  'use strict';
  if (!FSRS || !FSRS.fsrs) throw new Error('FSRS scheduler is unavailable.');

  const scheduler = FSRS.fsrs({ request_retention: 0.9, enable_fuzz: false });
  const { Rating } = FSRS;

  function asDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function restoreCard(saved, now = new Date()) {
    if (!saved || typeof saved !== 'object') return FSRS.createEmptyCard(now);
    const due = asDate(saved.due);
    const lastReview = saved.last_review == null ? undefined : asDate(saved.last_review);
    if (!due || (saved.last_review != null && !lastReview) || !Number.isFinite(Number(saved.reps))) return FSRS.createEmptyCard(now);
    return Object.assign({}, saved, { due, last_review: lastReview });
  }

  function saveCard(card) {
    return Object.assign({}, card, {
      due: card.due.getTime(),
      last_review: card.last_review ? card.last_review.getTime() : null
    });
  }

  function state(progress, now = new Date()) {
    const saved = progress && progress.fsrsCard;
    if (!saved) return { new: true, due: true, dueAt: null, retrievability: null, stability: 0, difficulty: 0 };
    const card = restoreCard(saved, now);
    if (!card.reps) return { new: true, due: true, dueAt: null, retrievability: null, stability: 0, difficulty: 0 };
    const retrievability = scheduler.get_retrievability(card, now, false);
    return {
      new: false,
      due: card.due.getTime() <= now.getTime(),
      dueAt: card.due.getTime(),
      retrievability: Number.isFinite(retrievability) ? retrievability : null,
      stability: Number(card.stability) || 0,
      difficulty: Number(card.difficulty) || 0
    };
  }

  function ratingForAnswer({ correct, hadMistake, timed, remaining, seconds }) {
    if (!correct || hadMistake) return Rating.Again;
    if (!timed || !Number.isFinite(seconds) || seconds <= 0) return Rating.Good;
    const fraction = Math.max(0, Math.min(1, remaining / seconds));
    return fraction >= 0.75 ? Rating.Easy : fraction <= 0.25 ? Rating.Hard : Rating.Good;
  }

  function review(progress, rating, now = new Date()) {
    const card = restoreCard(progress && progress.fsrsCard, now);
    return saveCard(scheduler.next(card, now, rating).card);
  }

  function compareForPractice(a, b, progressById, now = new Date()) {
    const one = state(progressById[a.id], now), two = state(progressById[b.id], now);
    const rank = item => item.new ? 1 : item.due ? 0 : 2;
    if (rank(one) !== rank(two)) return rank(one) - rank(two);
    if (!one.new && !two.new) {
      if (one.due && two.due) return (one.retrievability ?? 1) - (two.retrievability ?? 1);
      return one.dueAt - two.dueAt;
    }
    return 0;
  }

  return Object.freeze({ Rating, state, review, ratingForAnswer, compareForPractice });
});
