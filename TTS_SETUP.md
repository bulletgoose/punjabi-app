# Secure Punjabi cloud pronunciation setup

This guide is deliberately split into **safe preparation** and **billing-enabled activation**. Nothing in this repository enables billing, deploys a function, enables Google Cloud Text-to-Speech, or creates paid storage.

## What is already implemented

- The browser checks persistent IndexedDB audio first.
- If a speech endpoint is configured, the browser obtains a Firebase ID token and calls the app-owned endpoint with `Authorization: Bearer …`.
- The browser sends only Gurmukhi `text` and `mode` (`normal` or `slow`). It cannot choose a Google voice, language, pitch, or arbitrary rate.
- The backend verifies the ID token, checks `ALLOWED_TTS_UIDS`, calculates character usage, enforces conservative limits, checks a server cache, and only then calls Google Cloud Text-to-Speech.
- Google Application Default Credentials (the deployed runtime service identity) are used. No service-account JSON is required in the repository or browser.
- If cloud speech is disabled or fails, the existing Web Speech API is used only when a Punjabi (`pa`) voice exists. An English voice is never substituted.
- “Clear downloaded pronunciation audio” clears only the IndexedDB audio store. Saved sentences, vocabulary, ratings, flashcards, and settings are untouched.

The current server cache is an in-memory, per-function-instance LRU cache. It avoids repeat generation within a warm instance, but it is not a durable cross-instance cache. The `get`/`put` cache interface is intentionally replaceable by managed storage later. No chargeable persistent cache has been created.

## What can remain free on Firebase Spark

The static GitHub Pages/PWA, browser IndexedDB, local Web Speech fallback, and Firebase Authentication setup can be prepared without this repository enabling billing. Firebase products have current quotas and plan terms, so confirm them in the Firebase console before production use.

Deploying the included Firebase Cloud Function requires a billing-enabled Firebase/Google Cloud project. Calling Google Cloud Text-to-Speech also requires a billing account and enabling that API. Those are manual future steps; until then leave `speechEndpoint` blank and the app remains usable with a Punjabi device voice.

## 1. Configure Firebase Authentication

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Add Firebase to the existing Google Cloud project, or select its existing Firebase project. Carefully confirm the project ID before continuing.
3. In **Project settings → General → Your apps**, register a Web app.
4. Copy the public Web configuration values into `firebase-config.js`: `apiKey`, `authDomain`, `projectId`, and `appId`. These identifiers are designed to appear in browser code. They are **not** permission to use TTS.
5. Open **Build → Authentication → Sign-in method**, enable **Google**, choose a support email, and save.
6. In Authentication settings, add `punjabi.dockit.co.nz` and any exact preview/development hostname you genuinely use to Authorized domains. Do not add broad or untrusted domains.
7. Reload the app, open **Settings**, and choose **Sign in with Google**.

The app uses local Firebase Auth persistence. The backend still validates every token; a signed-in browser is not automatically authorized for TTS.

### Find your Firebase UID

After signing in, Settings displays your Firebase UID. You can also find it under **Firebase Console → Authentication → Users**. Copy the UID exactly into the backend `ALLOWED_TTS_UIDS` setting. A UID is an identifier, not a credential, but the allowlist belongs on the backend—not in public frontend code.

## 2. Prepare local configuration

1. Install Node.js 20 and the Firebase CLI on your development computer.
2. Copy `.firebaserc.example` to `.firebaserc` and replace the project placeholder.
3. In `functions/`, copy `.env.example` to `.env`.
4. Set at least:

   ```text
   ALLOWED_TTS_UIDS=your-exact-firebase-uid
   ALLOWED_ORIGINS=https://punjabi.dockit.co.nz,http://localhost:8000
   ```

5. Do not commit `.env`; it is ignored. Do not download or commit a service-account JSON key.

Environment settings:

| Setting | Purpose | Conservative default |
|---|---|---|
| `ALLOWED_TTS_UIDS` | Comma-separated users permitted to synthesize | empty/deny all |
| `ALLOWED_ORIGINS` | Exact permitted browser origins | empty/deny browser origins |
| `TTS_LANGUAGE` | Server-owned language | `pa-IN` |
| `TTS_VOICE` | Optional Google voice name; blank lets Google choose for `pa-IN` | blank |
| `TTS_SPEAKING_RATE` | Normal rate | `1.0` |
| `TTS_SLOW_SPEAKING_RATE` | Slow rate | `0.70` |
| `TTS_PITCH` | Pitch | `0` |
| `TTS_CACHE_VERSION` | Invalidates old audio when the voice/profile changes | `pa-IN-default-v1` |
| `MAX_TTS_TEXT_LENGTH` | Maximum server-counted Unicode characters per request | `500` |
| `MAX_TTS_REQUESTS_PER_MINUTE` | Per-UID burst protection | `10` |
| `MAX_TTS_CHARACTERS_PER_DAY` | Per-UID daily characters | `5000` |
| `MAX_TTS_CHARACTERS_PER_MONTH` | Per-UID monthly characters | `50000` |
| `TTS_USAGE_STORE` | `memory` locally; `firestore` for multi-instance enforcement | `memory` |

For production, use `firestore` so usage limits are transactional across function instances. This requires configuring Firestore and reviewing its billing/quota implications. The included in-memory limiter is useful for local/personal testing but resets on cold starts and is not sufficient protection for a public multi-instance service.

## 3. Local development without enabling cloud billing

Run static checks and backend unit tests:

```bash
cd functions
npm install
npm test
npm run check
```

Serve the frontend from an HTTP origin rather than opening `index.html` as `file://`, for example:

```bash
python3 -m http.server 8000
```

With `speechEndpoint: ''`, verify that Play and Slow use only a genuine Punjabi device voice and that Stop still works. In Safari/Chrome developer tools, inspect **Storage → IndexedDB → `punjabi-speech-cache-v1`**. It remains empty until cloud audio is received.

The Firebase emulators can exercise authentication/functions plumbing, but the final Google provider call still requires Application Default Credentials and an enabled TTS API. Never use a production service-account key in browser code. For a local backend test, use your normal developer ADC (`gcloud auth application-default login`) only on your own machine, and only after you deliberately enable the API/billing.

The function export is named `speech` and accepts the application route beneath its function URL, so the initial endpoint can be `YOUR_FUNCTION_URL/api/v1/speech`. If you later put Firebase Hosting/API Gateway in front, map the same `/api/v1/speech` route to this function. For the current GitHub Pages deployment, set `speechEndpoint` to that exact HTTPS URL. The frontend remains provider-independent.

## 4. Google Cloud setup — requires manual billing-enabled deployment later

Do not perform this section until you intentionally accept billing:

1. In Google Cloud Console, select the same project used by Firebase.
2. Attach the billing account yourself. This repository does not and cannot do it for you.
3. Enable **Cloud Text-to-Speech API** manually.
4. Use the Cloud Function runtime service account / service identity with Application Default Credentials. Do not create a downloadable key unless there is no safer deployment option.
5. Grant only the permission required to synthesize speech. Prefer the narrowest Google-provided Text-to-Speech role available in the IAM role picker; otherwise create a reviewed custom role containing only the documented synthesis permission. Do not grant Owner or Editor.
6. Configure backend environment variables, including your exact UID and origin. Treat them as backend runtime configuration.
7. Set `TTS_USAGE_STORE=firestore` for enforceable multi-instance limits and initialize Firestore only after reviewing plan/billing implications.
8. Keep `maxInstances: 2` (already in code) or lower it during personal testing.
9. Deploy only the function after reviewing current Firebase pricing. This deployment step requires Blaze/billing.
10. Copy the resulting HTTPS endpoint into `firebase-config.js` as `speechEndpoint`, deploy the static app, then test one short sentence.

The function is intentionally publicly invokable at the network layer so web and future native clients can reach it, but every speech request must pass Firebase token verification and the UID allowlist before synthesis. “Public invoker” does **not** mean anonymous TTS access.

## Test authorization and successful speech

Before enabling the frontend endpoint, make direct tests against the deployed URL:

- No `Authorization` header must return **401**.
- A valid Firebase token for a UID not in `ALLOWED_TTS_UIDS` must return **403**.
- A request from a browser origin not in `ALLOWED_ORIGINS` must return **403**.
- Non-JSON, blank text, unsupported fields, arbitrary voice/rate parameters, non-Gurmukhi text, and overly long text must be rejected before synthesis.
- Rapid/over-budget calls must return **429**.
- An allowed token and short Gurmukhi sentence should return `audio/mpeg`.
- Play the identical sentence twice. The second browser playback should be served from IndexedDB and create no network request to the endpoint.

Example shape (insert a short-lived Firebase ID token; never commit it):

```bash
curl -i -X POST 'YOUR_SPEECH_ENDPOINT' \
  -H 'Authorization: Bearer YOUR_SHORT_LIVED_FIREBASE_ID_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://punjabi.dockit.co.nz' \
  --data '{"text":"ਮੈਂ ਪੰਜਾਬੀ ਸਿੱਖ ਰਿਹਾ ਹਾਂ।","mode":"normal"}' \
  --output pronunciation.mp3
```

## Test IndexedDB and offline fallback

1. Sign in as an allowlisted account and play a sentence once online.
2. Confirm an audio `Blob` appears in `punjabi-speech-cache-v1/audio` and no Base64/audio payload appears in localStorage or the saved sentence object.
3. Play it again and confirm no `/speech` network request occurs.
4. Go offline and play the same sentence: downloaded audio should work.
5. Try an unheard sentence offline: a genuine installed Punjabi Web Speech voice may be used; otherwise the app explains that pronunciation is unavailable.
6. In Settings choose **Clear downloaded pronunciation audio** and confirm only the speech IndexedDB store is emptied.

## Revoke access or disable cloud speech

- Immediate user revocation: remove the UID from `ALLOWED_TTS_UIDS` and redeploy backend configuration. Revoking refresh tokens in Firebase Authentication is an additional measure.
- Disable the frontend feature without removing the backend: set `speechEndpoint: ''`; device Punjabi fallback continues.
- Disable synthesis at the source: disable the Text-to-Speech API or remove the runtime identity’s synthesis permission.
- Emergency backend stop: undeploy/disable the function through your cloud console. Do not rely only on hiding the frontend button.

## Change the Punjabi voice later

1. Change `TTS_VOICE`, rates, or pitch on the backend.
2. Change `TTS_CACHE_VERSION` to a new value.
3. Set the matching public `speechCacheVersion` in `firebase-config.js`.
4. Bump the service worker cache version before deploying static changes.

This prevents downloaded audio produced by an old profile being reused as the new voice. The frontend still does not learn the private provider configuration.

## Cost and quota safety checklist

Before enabling billing or production TTS, verify all of these:

- [ ] No Google Cloud credential, service-account key, Firebase Admin credential, or backend environment value appears in frontend source, GitHub, localStorage, IndexedDB, or an iOS bundle.
- [ ] Only your exact Firebase UID is present in `ALLOWED_TTS_UIDS`.
- [ ] A missing/invalid token returns 401 and a non-allowlisted valid user returns 403.
- [ ] Per-minute, per-day, and per-month limits are active with `TTS_USAGE_STORE=firestore` in multi-instance production.
- [ ] The server’s maximum text length is conservative.
- [ ] `ALLOWED_ORIGINS` lists only exact controlled web origins. (Native future apps have no Origin header but still require Firebase tokens and authorization.)
- [ ] The Cloud Function has a small `maxInstances` value.
- [ ] Text-to-Speech quotas are reduced to an appropriate development level where Google permits it.
- [ ] Cloud Billing budgets/alerts are configured. Ordinary alerts notify you; they are not automatically a guaranteed hard spending cap. Verify whether any currently offered spend-cap feature applies to TTS before relying on it.
- [ ] Repeated playback is served from IndexedDB and does not create a second backend request.
- [ ] Browser DevTools show only a short-lived Firebase ID token—not a Google credential.
- [ ] The runtime service identity has only the minimum synthesis permission, never Owner/Editor.
- [ ] Logging does not include ID tokens or full private error stacks.

## Known limitations and future extension points

- In-memory server audio caching is per warm instance and not durable. Add a reviewed object-storage cache behind the existing cache interface only when you intentionally accept its billing/security lifecycle.
- A Firebase web sign-in flow is appropriate for the PWA. A future Capacitor or native Swift app should use the platform Firebase Auth SDK, then call the same endpoint with its Firebase ID token.
- The current allowlist authorization function is isolated from authentication, usage, caching, and synthesis. It can later query a plan/entitlement record without redesigning speech generation.
- Browsers can evict IndexedDB under storage pressure or private browsing. Downloaded audio is a cache, not permanent user data.

Official references: [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [Firebase ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Cloud Text-to-Speech authentication](https://cloud.google.com/text-to-speech/docs/authentication), [Google Cloud budgets](https://cloud.google.com/billing/docs/how-to/budgets), and [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).
