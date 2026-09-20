'use strict';

const crypto = require('node:crypto');

class HttpError extends Error {
  constructor(status, code, publicMessage) {
    super(publicMessage);
    this.status = status;
    this.code = code;
    this.publicMessage = publicMessage;
  }
}

function sendJson(response, status, code, message) {
  response.status(status).set('Cache-Control', 'no-store').json({ error: { code, message } });
}

function countCharacters(text) { return Array.from(text).length; }

function parseBearer(request) {
  const header = request.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError(401, 'unauthenticated', 'Authentication is required.');
  return match[1];
}

function validateBody(request, config) {
  if (request.method !== 'POST') throw new HttpError(405, 'method-not-allowed', 'Use POST for speech requests.');
  if (request.path && !['/', '/api/v1/speech'].includes(request.path)) throw new HttpError(404, 'not-found', 'Speech endpoint not found.');
  if (!request.is('application/json')) throw new HttpError(415, 'unsupported-media-type', 'Content-Type must be application/json.');
  const body = request.body;
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new HttpError(400, 'invalid-request', 'A JSON request body is required.');
  const allowedKeys = new Set(['text', 'mode']);
  if (Object.keys(body).some(key => !allowedKeys.has(key))) throw new HttpError(400, 'invalid-request', 'Unsupported speech settings were supplied.');
  if (typeof body.text !== 'string') throw new HttpError(400, 'invalid-text', 'A text field is required.');
  const text = body.text.trim();
  if (!text) throw new HttpError(400, 'invalid-text', 'Text cannot be blank.');
  const characters = countCharacters(text);
  if (characters > config.maxTextLength) throw new HttpError(413, 'text-too-long', 'The pronunciation text is too long.');
  if (!/[\u0A00-\u0A7F]/u.test(text)) throw new HttpError(400, 'invalid-language', 'Punjabi Gurmukhi text is required.');
  const mode = body.mode === undefined ? 'normal' : body.mode;
  if (!['normal', 'slow'].includes(mode)) throw new HttpError(400, 'invalid-mode', 'Speech mode must be normal or slow.');
  return { text, mode, characters };
}

function applyCors(request, response, config) {
  const origin = request.get('origin');
  if (!origin) return;
  if (!config.allowedOrigins.has(origin)) throw new HttpError(403, 'origin-not-allowed', 'This application origin is not allowed.');
  response.set('Access-Control-Allow-Origin', origin);
  response.set('Vary', 'Origin');
  response.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.set('Access-Control-Max-Age', '3600');
}

function speechKey(config, text, mode) {
  return crypto.createHash('sha256').update(JSON.stringify({
    text,
    mode,
    language: config.language,
    voice: config.voice,
    rate: mode === 'slow' ? config.slowSpeakingRate : config.speakingRate,
    pitch: config.pitch,
    version: config.cacheVersion
  })).digest('hex');
}

function createSpeechHandler({ config, verifyToken, authorize, usage, cache, synthesize, logger = console }) {
  return async function speechHandler(request, response) {
    try {
      applyCors(request, response, config);
      if (request.method === 'OPTIONS') { response.status(204).send(''); return; }
      const input = validateBody(request, config);
      const token = parseBearer(request);
      const decoded = await verifyToken(token);
      if (!decoded || !decoded.uid) throw new HttpError(401, 'invalid-token', 'Authentication is invalid or expired.');
      const entitlement = await authorize(decoded.uid, decoded);
      if (!entitlement || !entitlement.allowed) throw new HttpError(403, 'not-authorized', 'Cloud pronunciation is not enabled for this account.');
      await usage.consume(decoded.uid, input.characters, entitlement);

      const key = speechKey(config, input.text, input.mode);
      const cached = await cache.get(key);
      let audio = cached;
      let cacheStatus = 'HIT';
      if (!audio) {
        audio = await synthesize({ text: input.text, mode: input.mode });
        if (!Buffer.isBuffer(audio) || !audio.length) throw new Error('Speech provider returned no audio.');
        await cache.put(key, audio);
        cacheStatus = 'MISS';
      }

      response.status(200)
        .set('Content-Type', 'audio/mpeg')
        .set('Content-Length', String(audio.length))
        .set('Cache-Control', 'private, no-store')
        .set('X-Speech-Cache', cacheStatus)
        .set('X-Speech-Profile', config.cacheVersion)
        .send(audio);
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(response, error.status, error.code, error.publicMessage);
        return;
      }
      if (error && error.code === 'RATE_LIMIT') {
        sendJson(response, 429, 'limit-reached', 'Pronunciation limit reached. Try again later.');
        return;
      }
      if (error && /token|auth/i.test(error.code || '')) {
        sendJson(response, 401, 'invalid-token', 'Authentication is invalid or expired.');
        return;
      }
      logger.error('Speech request failed', { message: error && error.message ? error.message : 'Unknown error' });
      sendJson(response, 503, 'speech-unavailable', 'Cloud pronunciation is temporarily unavailable.');
    }
  };
}

module.exports = { HttpError, countCharacters, speechKey, createSpeechHandler, validateBody };
