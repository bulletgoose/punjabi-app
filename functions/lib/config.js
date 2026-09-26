'use strict';

function numberSetting(name, fallback, minimum, maximum) {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

function listSetting(name) {
  return new Set((process.env[name] || '').split(',').map(value => value.trim()).filter(Boolean));
}

function loadConfig() {
  const usageStore = (process.env.TTS_USAGE_STORE || 'memory').trim().toLowerCase();
  if (!['memory', 'firestore'].includes(usageStore)) throw new Error('TTS_USAGE_STORE must be memory or firestore.');
  const voiceProfiles = Object.freeze({
    female: Object.freeze({ primary: 'pa-IN-Chirp3-HD-Kore', fallback: 'pa-IN-Wavenet-A' }),
    male: Object.freeze({ primary: 'pa-IN-Chirp3-HD-Puck', fallback: 'pa-IN-Wavenet-B' })
  });
  return Object.freeze({
    allowedUids: listSetting('ALLOWED_TTS_UIDS'),
    allowedOrigins: listSetting('ALLOWED_ORIGINS'),
    language: (process.env.TTS_LANGUAGE || 'pa-IN').trim(),
    voiceProfiles,
    speakingRate: numberSetting('TTS_SPEAKING_RATE', 1, 0.25, 2),
    slowSpeakingRate: numberSetting('TTS_SLOW_SPEAKING_RATE', 0.7, 0.25, 2),
    pitch: numberSetting('TTS_PITCH', 0, -20, 20),
    cacheVersion: (process.env.TTS_CACHE_VERSION || 'pa-IN-gender-v2').trim(),
    maxTextLength: numberSetting('MAX_TTS_TEXT_LENGTH', 500, 1, 5000),
    maxRequestsPerMinute: numberSetting('MAX_TTS_REQUESTS_PER_MINUTE', 10, 1, 1000),
    maxCharactersPerDay: numberSetting('MAX_TTS_CHARACTERS_PER_DAY', 5000, 1, 10000000),
    maxCharactersPerMonth: numberSetting('MAX_TTS_CHARACTERS_PER_MONTH', 50000, 1, 100000000),
    usageStore,
    memoryCacheItems: numberSetting('TTS_MEMORY_CACHE_ITEMS', 100, 0, 1000)
  });
}

module.exports = { loadConfig };
