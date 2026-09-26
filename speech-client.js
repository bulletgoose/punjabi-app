(function () {
  'use strict';

  const DB_NAME = 'punjabi-speech-cache-v1';
  const STORE_NAME = 'audio';
  const DB_VERSION = 1;
  const activeRequests = new Map();
  let activeAudio = null;
  let activeObjectUrl = '';
  let activeController = null;

  class SpeechClientError extends Error {
    constructor(code, message, status) {
      super(message);
      this.name = 'SpeechClientError';
      this.code = code;
      this.status = status || 0;
    }
  }

  function config() { return window.PUNJABI_APP_CONFIG || {}; }
  function isCloudConfigured() { return Boolean(config().speechEndpoint); }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new SpeechClientError('storage-unavailable', 'Downloaded pronunciation storage is not available.'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB could not be opened.'));
    });
  }

  async function withStore(mode, work) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let result;
      try { result = work(store); } catch (error) { db.close(); reject(error); return; }
      transaction.oncomplete = () => { db.close(); resolve(result && result.result); };
      transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Pronunciation storage failed.')); };
      transaction.onabort = transaction.onerror;
    });
  }

  async function sha256(value) {
    if (!window.crypto || !crypto.subtle) throw new SpeechClientError('hash-unavailable', 'Secure audio cache keys are not supported by this browser.');
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function selectedVoice(voice) { return voice === 'male' ? 'male' : 'female'; }

  async function cacheKey(text, mode, voice) {
    return sha256(JSON.stringify({
      text,
      language: 'pa-IN',
      mode: mode === 'slow' ? 'slow' : 'normal',
      voice: selectedVoice(voice),
      endpoint: config().speechEndpoint || '',
      profile: config().speechCacheVersion || 'pa-IN-default-v1'
    }));
  }

  async function getCached(key) {
    try { return await withStore('readonly', store => store.get(key)); }
    catch (error) { console.warn('Pronunciation cache could not be read.', error); return null; }
  }

  async function putCached(record) {
    try { await withStore('readwrite', store => store.put(record)); }
    catch (error) { console.warn('Pronunciation played but could not be downloaded for offline use.', error); }
  }

  function errorForStatus(status) {
    if (status === 401) return new SpeechClientError('unauthenticated', 'Sign in to use cloud pronunciation.', status);
    if (status === 403) return new SpeechClientError('unauthorized', 'Cloud pronunciation is not enabled for this account.', status);
    if (status === 429) return new SpeechClientError('limit', 'Pronunciation limit reached. Try again later.', status);
    if (status === 400 || status === 413 || status === 415) return new SpeechClientError('invalid', 'This sentence cannot be sent for pronunciation.', status);
    return new SpeechClientError('backend-unavailable', 'Cloud pronunciation is temporarily unavailable.', status);
  }

  async function authenticatedFetch(url, options = {}) {
    if (!navigator.onLine) throw new SpeechClientError('offline', 'This pronunciation has not been downloaded yet.');
    if (!isCloudConfigured()) throw new SpeechClientError('cloud-disabled', 'Cloud pronunciation is not configured.');
    const auth = window.PunjabiCloudAuth;
    if (!auth || !auth.configured) throw new SpeechClientError('auth-unconfigured', 'Cloud sign-in is not configured.');
    const token = await auth.getIdToken();
    if (!token) throw new SpeechClientError('unauthenticated', 'Sign in to use cloud pronunciation.');

    const controller = new AbortController();
    activeController = controller;
    let response;
    try {
      response = await fetch(url, Object.assign({}, options, {
        headers: Object.assign({}, options.headers || {}, {
          'Authorization': 'Bearer ' + token,
        }),
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      }));
    } catch (error) {
      if (error && error.name === 'AbortError') throw new SpeechClientError('cancelled', 'Playback stopped.');
      throw new SpeechClientError(navigator.onLine ? 'backend-unavailable' : 'offline', navigator.onLine ? 'Cloud pronunciation is temporarily unavailable.' : 'This pronunciation has not been downloaded yet.');
    } finally {
      if (activeController === controller) activeController = null;
    }
    if (!response.ok) throw errorForStatus(response.status);
    return response;
  }

  async function requestCloud(text, mode, voice, key) {
    const selected = selectedVoice(voice);
    const response = await authenticatedFetch(config().speechEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode: mode === 'slow' ? 'slow' : 'normal', voice: selected })
    });
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
    if (!contentType.startsWith('audio/')) throw new SpeechClientError('invalid-response', 'Cloud pronunciation returned an invalid response.');
    const blob = await response.blob();
    if (!blob.size) throw new SpeechClientError('invalid-response', 'Cloud pronunciation returned empty audio.');
    await putCached({ key, blob, mimeType: contentType, createdAt: Date.now(), text, mode, voice: selected, profile: config().speechCacheVersion || '' });
    return { blob, source: 'cloud' };
  }

  async function getAudio(text, mode, voice) {
    const selected = selectedVoice(voice);
    const key = await cacheKey(text, mode, selected);
    const cached = await getCached(key);
    if (cached && cached.blob instanceof Blob && cached.blob.size) return { blob: cached.blob, source: 'downloaded', key };
    if (!activeRequests.has(key)) activeRequests.set(key, requestCloud(text, mode, selected, key).finally(() => activeRequests.delete(key)));
    const result = await activeRequests.get(key);
    return Object.assign({ key }, result);
  }

  function stop() {
    if (activeController) activeController.abort();
    activeController = null;
    if (activeAudio) {
      try { activeAudio.pause(); activeAudio.currentTime = 0; } catch (error) { /* Best effort. */ }
    }
    activeAudio = null;
    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = '';
  }

  async function play(text, mode, voice) {
    stop();
    const result = await getAudio(text, mode, voice);
    const objectUrl = URL.createObjectURL(result.blob);
    const audio = new Audio(objectUrl);
    activeAudio = audio;
    activeObjectUrl = objectUrl;
    const finished = new Promise((resolve, reject) => {
      const clean = () => {
        if (activeAudio === audio) activeAudio = null;
        if (activeObjectUrl === objectUrl) activeObjectUrl = '';
        URL.revokeObjectURL(objectUrl);
      };
      audio.onended = () => { clean(); resolve(); };
      audio.onerror = () => { clean(); reject(new SpeechClientError('playback', 'The downloaded pronunciation could not be played.')); };
    });
    try { await audio.play(); }
    catch (error) { stop(); throw new SpeechClientError('playback-blocked', 'Tap Play again to hear the downloaded pronunciation.'); }
    return Object.assign({ finished }, result);
  }

  async function clearCache() {
    stop();
    try { await withStore('readwrite', store => store.clear()); }
    catch (error) {
      if (window.indexedDB) await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Pronunciation storage is still open.'));
      }); else throw error;
    }
  }

  async function getUsage() {
    const endpoint = (config().speechEndpoint || '').replace(/\/$/, '') + '/usage';
    const response = await authenticatedFetch(endpoint, { method: 'GET' });
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
    if (contentType !== 'application/json') throw new SpeechClientError('invalid-response', 'Cloud pronunciation returned invalid usage information.');
    return response.json();
  }

  window.PunjabiSpeechClient = Object.freeze({
    SpeechClientError,
    isCloudConfigured,
    cacheKey,
    getCached,
    getAudio,
    play,
    getUsage,
    stop,
    clearCache
  });
})();
