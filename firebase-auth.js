import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';

const config = window.PUNJABI_APP_CONFIG || {};
const firebaseConfig = config.firebase || {};
const configured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain &&
  firebaseConfig.projectId && firebaseConfig.appId
);

let auth = null;
let user = null;
let status = configured ? 'loading' : 'unconfigured';
let initializationError = null;
let readyResolve;
const ready = new Promise(resolve => { readyResolve = resolve; });

function announce(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function publicUser(currentUser) {
  return currentUser ? {
    uid: currentUser.uid,
    displayName: currentUser.displayName || '',
    email: currentUser.email || ''
  } : null;
}

const api = {
  configured,
  ready,
  getUser: () => publicUser(user),
  getState: () => ({ status, user: publicUser(user), error: initializationError }),
  async getIdToken(forceRefresh = false) {
    await ready;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  },
  async signIn() {
    await ready;
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error && ['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/web-storage-unsupported'].includes(error.code)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }
  },
  async signOut() {
    await ready;
    if (auth) await signOut(auth);
  }
};

window.PunjabiCloudAuth = api;

if (!configured) {
  readyResolve();
  announce('punjabi-auth-ready', { configured: false, status, user: null });
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);
    try { await getRedirectResult(auth); } catch (error) {
      console.warn('Firebase sign-in redirect could not be completed.', error && error.code ? error.code : error);
    }
    let firstState = true;
    onAuthStateChanged(auth, currentUser => {
      user = currentUser;
      status = 'ready';
      initializationError = null;
      const detail = { configured: true, status, user: publicUser(user) };
      if (firstState) {
        firstState = false;
        readyResolve();
        announce('punjabi-auth-ready', detail);
      }
      announce('punjabi-auth-changed', detail);
    }, error => {
      console.warn('Firebase Authentication state could not be loaded.', error);
      status = 'error';
      initializationError = error && error.code ? error.code : 'auth/state-load-failed';
      if (firstState) {
        firstState = false;
        readyResolve();
        announce('punjabi-auth-ready', { configured: true, status, user: null, error: initializationError });
      }
    });
  } catch (error) {
    console.warn('Firebase Authentication could not be initialized.', error);
    status = 'error';
    initializationError = error && error.code ? error.code : 'auth/initialization-failed';
    readyResolve();
    announce('punjabi-auth-ready', { configured: true, status, user: null, error: initializationError });
  }
}
