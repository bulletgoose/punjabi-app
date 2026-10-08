# Preview and review before merging

Use the pull request branch in a separate local checkout. Do not replace a working production checkout or clear the production website's browser data.

```sh
git clone --branch feature/unified-punjabi-learning-architecture https://github.com/bulletgoose/punjabi-app.git
cd punjabi-app
python3 -m http.server 8000
```

Open **http://localhost:8000**. This is a local static preview; no build, paid hosting, new database or cloud API is required. The localhost preview uses its own browser storage. Production saved vocabulary cannot be read by localhost; do not clear or export production settings unless you want to perform a deliberate migration rehearsal with a copy.

Review these paths:

1. Generate a sentence and open its breakdown. Check dictionary forms and agreement explanations.
2. In the sentence-set selector, try P47–P58 as well as existing patterns. Change WHO gender in Building Blocks and check agreement.
3. Browse Vocabulary, search in all three scripts, choose topics/subtopics, and open meaning/source details. Add a test word, reload, then edit/remove it. The library displays review status.
4. In Flashcards, choose Vocabulary words and a topic. Retain a sentence-deck round to check the existing experience.
5. In Word Game, use Written text only to review without cloud audio. Pick different prompt/tile scripts and several topics. Existing audio games require the existing configured speech endpoint and sign-in.
6. Save a sentence and a word, reload, and review Saved. If testing a migration fixture, keep the automatic pre-migration backup.
7. After the first load and service-worker installation, reload once, stop the server or disconnect networking, then generate and browse cached vocabulary. Optional downloaded audio uses the existing IndexedDB cache.

For physical Safari/iPhone review, use an authorized HTTPS preview origin if one is already available; this change does not publish or configure one. Check Google sign-in authorized domains before testing account features on a new origin. Install the preview as a PWA on a physical iPhone and confirm the keyboard, narrow layout, saved state and offline reload. These physical-device/account checks remain manual.

Run automated checks with an existing Node runtime:

```sh
node --test tests/*.test.js functions/test/*.test.js
```

Optional browser regression checks require Playwright and its Chromium/WebKit runtimes:

```sh
node scripts/browser-check.js
```

Set `BASELINE_DIR` to an unchanged checkout of the documented base commit to include the original-data migration fixture. The script starts and stops its own local preview server; it writes reports under `reports/`. The imported data is under CC BY-SA 4.0; the app includes visible attribution and source links. See the implementation report for linguistic limits and the exact tests already run.

The pull request targets main and remains unmerged. Review and native linguistic validation should precede a production rollout.
