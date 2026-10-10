# Preview and review before merging

Use the pull request branch in a separate local checkout. Do not replace a working production checkout or clear the production website's browser data.

```sh
git clone --branch feature/complete-vocabulary-grammar-integration https://github.com/bulletgoose/punjabi-app.git
cd punjabi-app
python3 -m http.server 8000
```

Open **http://localhost:8000**. This is a local static preview; no build, paid hosting, new database or cloud API is required. The localhost preview uses its own browser storage. Production saved vocabulary cannot be read by localhost; do not clear or export production settings unless you want to perform a deliberate migration rehearsal with a copy.

Review these paths:

1. Generate a sentence and open its breakdown. Expand individual parts to check the contextual meaning, dictionary senses, shared Meaning & Usage information and supported grammar explanations.
2. In the sentence-set selector, try the new descriptive, identification, location and occupation patterns as well as existing past/future patterns. Change WHO gender in Building Blocks and check agreement. Search the expanded Building Block lists.
3. Browse Vocabulary, search in all three scripts, choose topics/subtopics, and open meaning/source details. Add a test word, reload, then edit/remove it. The library displays review status.
4. In Flashcards, choose Vocabulary words and a topic. Retain a sentence-deck round to check the existing experience.
5. In Word Game, use Written text only to review without cloud audio. Pick different prompt/tile scripts and several topics. Existing audio games require the existing configured speech endpoint and sign-in.
6. Save a sentence and a word, reload, and review Saved. If testing a migration fixture, keep the automatic pre-migration backup.
7. After the first load and service-worker installation, reload once, stop the server or disconnect networking, then generate and browse cached vocabulary. Optional downloaded audio uses the existing IndexedDB cache.

For physical Safari/iPhone review, use an authorized HTTPS preview origin if one is already available; this change does not publish or configure one. Check Google sign-in authorized domains before testing account features on a new origin. Install the preview as a PWA on a physical iPhone and confirm the keyboard, narrow layout, saved state and offline reload. These physical-device/account checks remain manual.

Run automated checks with an existing Node runtime:

```sh
node scripts/run-tests.js
node scripts/audit-report.js
node scripts/translation-examples.js
```

Optional browser regression checks require Playwright and its Chromium/WebKit runtimes:

```sh
node scripts/browser-check.js
```

The browser script creates a migration fixture from the previous feature commit, `49ded7b`, using its actual compact persistence format. `BASELINE_REF` can select another committed baseline. It includes user translations, disabled words/templates, saved words/sentences, custom words/templates, deletion tombstones and prior learning records. The script starts and stops its own local preview servers and writes reports under `reports/`. It checks desktop Chromium, desktop WebKit and iPhone WebKit emulation. WebKit offline checks stop the origin server; Chromium uses browser offline mode. These are automated engines, not physical Safari/iPhone tests.

The audit script compares pristine initializations at the baseline commit and current branch. It distinguishes lexical IDs from constructed phrase bindings and records the exact metadata states and unresolved reasons. Generated samples demonstrate actual rendering; their random sample coverage is not an exhaustive linguistic review. The imported data is under CC BY-SA 4.0; the app includes visible attribution and source links.

The pull request targets main. The user’s latest instruction (2026-10-10) authorizes merging after successful checks. Native linguistic verification remains an ongoing review task. This change adds no hosting configuration or paid infrastructure.
