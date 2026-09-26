/*
 * Public browser configuration only. Firebase Web configuration identifies
 * the Firebase project; it is not a credential or an authorization boundary.
 * Never put service-account JSON, Google Cloud API keys used for TTS, or
 * backend environment variables in this file.
 */
window.PUNJABI_APP_CONFIG = Object.freeze({
  firebase: Object.freeze({
    apiKey: 'AIzaSyBkg0JF3yl48PuVEgQFSA28tRZfmm-H4kQ',
    authDomain: 'project-74e20bff-23aa-4038-92e.firebaseapp.com',
    projectId: 'project-74e20bff-23aa-4038-92e',
    appId: '1:416967516054:web:ee5f9086c42c6ba55147b7'
  }),

  // Leave blank to disable cloud pronunciation. For GitHub Pages this will
  // normally be the HTTPS URL of the deployed function ending in /api/v1/speech.
  speechEndpoint: 'https://speech-kycy45twoq-uc.a.run.app/api/v1/speech',

  // Change this when the backend voice/profile changes so old client audio is
  // not mistaken for the new voice. It contains no secret configuration.
  speechCacheVersion: 'pa-IN-gender-v2'
});
