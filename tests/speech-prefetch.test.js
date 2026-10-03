const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

test('stopping playback does not cancel background pronunciation preparation', async () => {
  let started;
  const fetchStarted = new Promise(resolve => { started = resolve; });
  let finishFetch;
  const records = new Map();
  const indexedDB = { open() {
    const request = {};
    queueMicrotask(() => {
      request.result = {
        objectStoreNames: { contains: () => true },
        close() {},
        transaction() {
          const transaction = { objectStore() { return {
            get(key) { const result = { result: records.get(key) }; queueMicrotask(() => transaction.oncomplete()); return result; },
            put(record) { records.set(record.key, record); const result = { result: record.key }; queueMicrotask(() => transaction.oncomplete()); return result; }
          }; } };
          return transaction;
        }
      };
      request.onsuccess();
    });
    return request;
  } };
  const context = {
    window: {
      crypto: webcrypto,
      indexedDB,
      PUNJABI_APP_CONFIG: { speechEndpoint: 'https://example.test/speech' },
      PunjabiCloudAuth: { configured: true, getIdToken: async () => 'test-token' }
    },
    navigator: { onLine: true },
    indexedDB,
    crypto: webcrypto,
    TextEncoder,
    Blob,
    Uint8Array,
    AbortController,
    URL,
    console: { warn() {} },
    fetch: (url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
      finishFetch = () => resolve({
        ok: true,
        headers: { get: () => 'audio/mpeg' },
        blob: async () => new Blob(['audio'], { type: 'audio/mpeg' })
      });
      started(options.signal);
    })
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'speech-client.js'), 'utf8'), context);
  const prepared = context.window.PunjabiSpeechClient.prefetch('ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'normal', 'female');
  const signal = await fetchStarted;
  context.window.PunjabiSpeechClient.stop();
  assert.equal(signal.aborted, false);
  finishFetch();
  assert.equal((await prepared).source, 'cloud');
  assert.equal(await context.window.PunjabiSpeechClient.hasCached('ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'normal', 'female'), true);
});

function makeClient(fetch, options = {}) {
  const records = new Map();
  const indexedDB = { open() {
    const request = {};
    queueMicrotask(() => {
      request.result = {
        objectStoreNames: { contains: () => true },
        close() {},
        transaction() {
          const transaction = { objectStore() { return {
            get(key) { const result = { result: records.get(key) }; queueMicrotask(() => transaction.oncomplete()); return result; },
            put(record) { records.set(record.key, record); const result = { result: record.key }; queueMicrotask(() => transaction.oncomplete()); return result; }
          }; } };
          return transaction;
        }
      };
      request.onsuccess();
    });
    return request;
  } };
  const context = {
    window: {
      crypto: webcrypto,
      indexedDB,
      PUNJABI_APP_CONFIG: { speechEndpoint: 'https://example.test/speech' },
      PunjabiCloudAuth: { configured: true, getIdToken: async () => 'test-token' }
    },
    navigator: { onLine: true }, indexedDB, crypto: webcrypto, TextEncoder, Blob, Uint8Array, AbortController, URL,
    console: { warn() {} }, fetch, Date: options.Date || Date,
    setTimeout: options.setTimeout || setTimeout
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'speech-client.js'), 'utf8'), context);
  return context.window.PunjabiSpeechClient;
}

function audioResponse() {
  return { ok: true, headers: { get: () => 'audio/mpeg' }, blob: async () => new Blob(['audio'], { type: 'audio/mpeg' }) };
}

test('successful section downloads have no fixed delay between different words', async () => {
  let requests = 0;
  const client = makeClient(async () => { requests++; return audioResponse(); }, {
    setTimeout() { throw new Error('A successful download must not sleep.'); }
  });
  await client.prefetch('ਪਹਿਲਾ', 'normal', 'female');
  await client.prefetch('ਦੂਜਾ', 'normal', 'female');
  assert.equal(requests, 2);
});

test('a per-minute 429 waits for the next minute then retries', async () => {
  let now = Date.UTC(2026, 0, 1, 0, 0, 20);
  const waits = [];
  let speechRequests = 0;
  const client = makeClient(async url => {
    if (url.endsWith('/usage')) return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ dailyLimit: 5000, dailyCharacters: 10, monthlyLimit: 50000, monthlyCharacters: 10 }) };
    speechRequests++;
    return speechRequests === 1 ? { ok: false, status: 429 } : audioResponse();
  }, {
    Date: class extends Date { static now() { return now; } },
    setTimeout(resolve, wait) { waits.push(wait); now += wait; queueMicrotask(resolve); }
  });
  assert.equal((await client.prefetch('ਪਹਿਲਾ', 'normal', 'female')).source, 'cloud');
  assert.equal(speechRequests, 2);
  assert.deepEqual(waits, [41000]);
});

test('a character-limit 429 does not keep retrying', async () => {
  let speechRequests = 0;
  const client = makeClient(async url => {
    if (url.endsWith('/usage')) return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ dailyLimit: 5000, dailyCharacters: 5000, monthlyLimit: 50000, monthlyCharacters: 5000 }) };
    speechRequests++;
    return { ok: false, status: 429 };
  }, { setTimeout() { throw new Error('Character limits must not trigger a wait.'); } });
  await assert.rejects(client.prefetch('ਪਹਿਲਾ', 'normal', 'female'), /Daily or monthly pronunciation limit reached/);
  assert.equal(speechRequests, 1);
});
