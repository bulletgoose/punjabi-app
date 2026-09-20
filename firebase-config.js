/*
 * Public browser configuration only. Firebase Web configuration identifies
 * the Firebase project; it is not a credential or an authorization boundary.
 * Never put service-account JSON, Google Cloud API keys used for TTS, or
 * backend environment variables in this file.
 */
window.PUNJABI_APP_CONFIG = Object.freeze({
  firebase: Object.freeze({
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: ''
  }),

  // Leave blank to disable cloud pronunciation. For GitHub Pages this will
  // normally be the HTTPS URL of the deployed function ending in /api/v1/speech.
  speechEndpoint: '',

  // Change this when the backend voice/profile changes so old client audio is
  // not mistaken for the new voice. It contains no secret configuration.
  speechCacheVersion: 'pa-IN-default-v1'
});
