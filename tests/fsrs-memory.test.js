'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const memory = require('../fsrs-memory.js');

test('each vocabulary word keeps an independent FSRS card with a due date', () => {
  const now = new Date('2026-10-03T00:00:00Z');
  const first = { fsrsCard: memory.review({}, memory.Rating.Good, now) };
  assert.equal(first.fsrsCard.reps, 1);
  assert.equal(typeof first.fsrsCard.due, 'number');
  assert.ok(memory.state(first, now).stability > 0);
  assert.equal(memory.state({}, now).new, true);
  const later = new Date('2026-10-04T00:00:00Z');
  assert.equal(memory.state(first, later).due, true);
  const second = { fsrsCard: memory.review({}, memory.Rating.Again, now) };
  assert.notDeepEqual(first.fsrsCard, second.fsrsCard);
});

test('game answers map to FSRS Again, Hard, Good and Easy', () => {
  const grade = (correct, hadMistake, remaining) => memory.ratingForAnswer({ correct, hadMistake, timed: true, remaining, seconds: 20 });
  assert.equal(grade(false, false, 15), memory.Rating.Again);
  assert.equal(grade(true, true, 19), memory.Rating.Again);
  assert.equal(grade(true, false, 2), memory.Rating.Hard);
  assert.equal(grade(true, false, 10), memory.Rating.Good);
  assert.equal(grade(true, false, 19), memory.Rating.Easy);
  assert.equal(memory.ratingForAnswer({ correct: true, hadMistake: false, timed: false }), memory.Rating.Good);
});

test('due cards are ranked before new cards and future reviews', () => {
  const dayOne = new Date('2026-10-03T00:00:00Z');
  const now = new Date('2026-10-04T00:00:00Z');
  const progress = {
    due: { fsrsCard: memory.review({}, memory.Rating.Good, dayOne) },
    future: { fsrsCard: memory.review({}, memory.Rating.Easy, now) }
  };
  assert.ok(memory.compareForPractice({id:'due'},{id:'new'},progress,now)<0);
  assert.ok(memory.compareForPractice({id:'new'},{id:'future'},progress,now)<0);
});
