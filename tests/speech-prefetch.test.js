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
