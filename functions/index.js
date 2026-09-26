'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const textToSpeech = require('@google-cloud/text-to-speech');
const { loadConfig } = require('./lib/config');
const { createSpeechHandler } = require('./lib/speech-app');
const { MemorySpeechCache, MemoryUsageStore, FirestoreUsageStore } = require('./lib/stores');

if (!getApps().length) initializeApp();
const config = loadConfig();
const ttsClient = new textToSpeech.TextToSpeechClient();
const cache = new MemorySpeechCache(config.memoryCacheItems);
const usage = config.usageStore === 'firestore' ? new FirestoreUsageStore(config, getFirestore()) : new MemoryUsageStore(config);

async function authorize(uid) {
  // Deliberately isolated from authentication and usage so an entitlement or
  // subscription service can replace this allowlist without changing speech.
  return { allowed: config.allowedUids.has(uid), plan: 'personal' };
}

async function synthesize({ text, mode, voice }) {
  const profile = config.voiceProfiles[voice];
  let primaryError;
  for (const [index, name] of [profile.primary, profile.fallback].entries()) {
    try {
      const [result] = await ttsClient.synthesizeSpeech({
        input: { text },
        voice: { languageCode: config.language, name },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: mode === 'slow' ? config.slowSpeakingRate : config.speakingRate,
          pitch: config.pitch
        }
      });
      return Buffer.from(result.audioContent || []);
    } catch (error) {
      if (index === 0) {
        primaryError = error;
        console.warn('Primary Punjabi voice failed; trying its WaveNet fallback.', { voice });
      } else {
        throw primaryError || error;
      }
    }
  }
  return Buffer.alloc(0);
}

const handler = createSpeechHandler({
  config,
  verifyToken: token => getAuth().verifyIdToken(token, true),
  authorize,
  usage,
  cache,
  synthesize
});

exports.speech = onRequest({
  region: 'us-central1',
  timeoutSeconds: 30,
  memory: '256MiB',
  maxInstances: 2,
  invoker: 'public'
}, handler);
