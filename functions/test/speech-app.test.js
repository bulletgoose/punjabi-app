'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSpeechHandler, countCharacters, speechKey } = require('../lib/speech-app');
const { MemorySpeechCache, MemoryUsageStore } = require('../lib/stores');

const config = {
  allowedOrigins: new Set(['https://punjabi.dockit.co.nz']), language: 'pa-IN',
  voiceProfiles: {
    female: { primary: 'pa-IN-Chirp3-HD-Kore', fallback: 'pa-IN-Wavenet-A' },
    male: { primary: 'pa-IN-Chirp3-HD-Puck', fallback: 'pa-IN-Wavenet-B' }
  }, speakingRate: 1,
  slowSpeakingRate: 0.7, pitch: 0, cacheVersion: 'test-v1', maxTextLength: 100,
  maxRequestsPerMinute: 2, maxCharactersPerDay: 100, maxCharactersPerMonth: 200
};

function request(overrides = {}) {
  const headers = Object.assign({ authorization: 'Bearer valid', origin: 'https://punjabi.dockit.co.nz', 'content-type': 'application/json' }, overrides.headers || {});
  return Object.assign({ method: 'POST', path: '/api/v1/speech', body: { text: 'ਮੈਂ ਪੰਜਾਬੀ ਸਿੱਖਦਾ ਹਾਂ।', mode: 'normal' }, get: name => headers[name.toLowerCase()] || '', is: type => headers['content-type'] === type }, overrides);
}

function response() {
  return { statusCode: 0, headers: {}, body: null, status(value) { this.statusCode = value; return this; }, set(name, value) { this.headers[name] = value; return this; }, json(value) { this.body = value; return this; }, send(value) { this.body = value; return this; } };
}

test('counts Unicode characters instead of trusting a browser count', () => assert.equal(countCharacters('ਮੈਂ'), 3));

test('speech cache key changes with backend speech configuration', () => {
  assert.notEqual(speechKey(config, 'ਪੰਜਾਬੀ', 'normal'), speechKey(config, 'ਪੰਜਾਬੀ', 'slow'));
  assert.notEqual(speechKey(config, 'ਪੰਜਾਬੀ', 'normal', 'female'), speechKey(config, 'ਪੰਜਾਬੀ', 'normal', 'male'));
});

test('rejects missing authentication before synthesis', async () => {
  let synthesized = false;
  const handler = createSpeechHandler({ config, verifyToken: async () => ({ uid: 'u1' }), authorize: async () => ({ allowed: true }), usage: { consume: async () => {} }, cache: new MemorySpeechCache(3), synthesize: async () => { synthesized = true; return Buffer.from('audio'); } });
  const res = response(); await handler(request({ headers: { authorization: '', origin: 'https://punjabi.dockit.co.nz', 'content-type': 'application/json' } }), res);
  assert.equal(res.statusCode, 401); assert.equal(synthesized, false);
});

test('rejects authenticated users not on the allowlist', async () => {
  const handler = createSpeechHandler({ config, verifyToken: async () => ({ uid: 'u2' }), authorize: async () => ({ allowed: false }), usage: { consume: async () => {} }, cache: new MemorySpeechCache(3), synthesize: async () => Buffer.from('audio') });
  const res = response(); await handler(request(), res); assert.equal(res.statusCode, 403);
});

test('rejects unapproved browser origins before authentication', async () => {
  let verified = false;
  const handler = createSpeechHandler({ config, verifyToken: async () => { verified = true; return { uid: 'u1' }; }, authorize: async () => ({ allowed: true }), usage: { consume: async () => {} }, cache: new MemorySpeechCache(3), synthesize: async () => Buffer.from('audio') });
  const res = response(); await handler(request({ headers: { origin: 'https://attacker.example' } }), res);
  assert.equal(res.statusCode, 403); assert.equal(verified, false);
});

test('rejects client-supplied voices outside the server allowlist', async () => {
  let synthesized = false;
  const handler = createSpeechHandler({ config, verifyToken: async () => ({ uid: 'u1' }), authorize: async () => ({ allowed: true }), usage: { consume: async () => {} }, cache: new MemorySpeechCache(3), synthesize: async () => { synthesized = true; return Buffer.from('audio'); } });
  const res = response(); await handler(request({ body: { text: 'ਪੰਜਾਬੀ', voice: 'arbitrary-google-voice' } }), res);
  assert.equal(res.statusCode, 400); assert.equal(synthesized, false);
});

test('passes an allowlisted voice choice to synthesis', async () => {
  let selectedVoice = '';
  const handler = createSpeechHandler({ config, verifyToken: async () => ({ uid: 'u1' }), authorize: async () => ({ allowed: true }), usage: { consume: async () => {} }, cache: new MemorySpeechCache(3), synthesize: async input => { selectedVoice = input.voice; return Buffer.from('audio'); } });
  const res = response(); await handler(request({ body: { text: 'ਪੰਜਾਬੀ', mode: 'normal', voice: 'male' } }), res);
  assert.equal(res.statusCode, 200); assert.equal(selectedVoice, 'male');
});

test('returns authenticated usage without consuming more characters', async () => {
  let consumed = false;
  const usage = { consume: async () => { consumed = true; }, get: async () => ({ dailyCharacters: 25, dailyLimit: 5000, monthlyCharacters: 50, monthlyLimit: 50000 }) };
  const handler = createSpeechHandler({ config, verifyToken: async () => ({ uid: 'u1' }), authorize: async () => ({ allowed: true }), usage, cache: new MemorySpeechCache(3), synthesize: async () => Buffer.from('audio') });
  const res = response(); await handler(request({ method: 'GET', path: '/api/v1/speech/usage', body: undefined }), res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.dailyCharacters, 25); assert.equal(consumed, false);
});

test('reuses identical server-cached audio', async () => {
  let calls = 0;
  const cache = new MemorySpeechCache(3);
  const handler = createSpeechHandler({ config, verifyToken: async () => ({ uid: 'u1' }), authorize: async () => ({ allowed: true }), usage: { consume: async () => {} }, cache, synthesize: async () => { calls += 1; return Buffer.from('audio'); } });
  const first = response(); const second = response();
  await handler(request(), first); await handler(request(), second);
  assert.equal(first.statusCode, 200); assert.equal(second.statusCode, 200); assert.equal(calls, 1); assert.equal(second.headers['X-Speech-Cache'], 'HIT');
});

test('enforces request and character limits from server-calculated text', async () => {
  const usage = new MemoryUsageStore(config);
  await usage.consume('u1', 20); await usage.consume('u1', 20);
  await assert.rejects(() => usage.consume('u1', 20), error => error.code === 'RATE_LIMIT');
});
