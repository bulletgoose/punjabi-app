'use strict';

function currentUsage(current, config, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const month = now.toISOString().slice(0, 7);
  return {
    day,
    dailyCharacters: current.day === day ? current.dailyCharacters || 0 : 0,
    dailyLimit: config.maxCharactersPerDay,
    month,
    monthlyCharacters: current.month === month ? current.monthlyCharacters || 0 : 0,
    monthlyLimit: config.maxCharactersPerMonth
  };
}

class MemorySpeechCache {
  constructor(maxItems) { this.maxItems = maxItems; this.items = new Map(); }
  async get(key) {
    const value = this.items.get(key);
    if (value) { this.items.delete(key); this.items.set(key, value); }
    return value || null;
  }
  async put(key, value) {
    if (!this.maxItems) return;
    this.items.set(key, value);
    while (this.items.size > this.maxItems) this.items.delete(this.items.keys().next().value);
  }
}

class MemoryUsageStore {
  constructor(config) { this.config = config; this.users = new Map(); }
  async consume(uid, characters) {
    const now = new Date();
    const minute = now.toISOString().slice(0, 16);
    const day = now.toISOString().slice(0, 10);
    const month = now.toISOString().slice(0, 7);
    const current = this.users.get(uid) || {};
    const requests = current.minute === minute ? current.requests || 0 : 0;
    const dailyCharacters = current.day === day ? current.dailyCharacters || 0 : 0;
    const monthlyCharacters = current.month === month ? current.monthlyCharacters || 0 : 0;
    if (requests + 1 > this.config.maxRequestsPerMinute ||
        dailyCharacters + characters > this.config.maxCharactersPerDay ||
        monthlyCharacters + characters > this.config.maxCharactersPerMonth) {
      const error = new Error('Usage limit exceeded.'); error.code = 'RATE_LIMIT'; throw error;
    }
    this.users.set(uid, { minute, requests: requests + 1, day, dailyCharacters: dailyCharacters + characters, month, monthlyCharacters: monthlyCharacters + characters });
  }
  async get(uid) { return currentUsage(this.users.get(uid) || {}, this.config); }
}

class FirestoreUsageStore {
  constructor(config, firestore) { this.config = config; this.firestore = firestore; }
  async consume(uid, characters) {
    const now = new Date();
    const minute = now.toISOString().slice(0, 16);
    const day = now.toISOString().slice(0, 10);
    const month = now.toISOString().slice(0, 7);
    const reference = this.firestore.collection('ttsUsage').doc(uid);
    await this.firestore.runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      const current = snapshot.exists ? snapshot.data() : {};
      const requests = current.minute === minute ? current.requests || 0 : 0;
      const dailyCharacters = current.day === day ? current.dailyCharacters || 0 : 0;
      const monthlyCharacters = current.month === month ? current.monthlyCharacters || 0 : 0;
      if (requests + 1 > this.config.maxRequestsPerMinute || dailyCharacters + characters > this.config.maxCharactersPerDay || monthlyCharacters + characters > this.config.maxCharactersPerMonth) {
        const error = new Error('Usage limit exceeded.'); error.code = 'RATE_LIMIT'; throw error;
      }
      transaction.set(reference, { minute, requests: requests + 1, day, dailyCharacters: dailyCharacters + characters, month, monthlyCharacters: monthlyCharacters + characters, updatedAt: now }, { merge: true });
    });
  }
  async get(uid) {
    const snapshot = await this.firestore.collection('ttsUsage').doc(uid).get();
    return currentUsage(snapshot.exists ? snapshot.data() : {}, this.config);
  }
}

module.exports = { MemorySpeechCache, MemoryUsageStore, FirestoreUsageStore, currentUsage };
