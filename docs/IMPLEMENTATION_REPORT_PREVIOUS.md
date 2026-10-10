# Implementation and review report

## Vocabulary expansion

| Measurement | Count |
| --- | ---: |
| Original category rows | 499 |
| Original verbs | 36 |
| Total input vocabulary before | 535 |
| Canonical original entries after safe consolidation | 529 |
| Dictionary records imported | 5,184 |
| Imported records that become new canonical entries | 5,130 |
| Imported records matched to existing entries | 54 |
| Consolidated original duplicate records | 6 |
| Total canonical vocabulary after | 5,659 |
| Net increase over original input count | 5,124 |
| Dictionary headword spellings | 4,851 |
| Dictionary senses | 8,190 |
| Newly reviewed direct-object noun metadata | 30 |

Counts describe a pristine existing-app fixture. User edits can correctly prevent a match and change these totals. This is dictionary coverage, not a claim of 5,659 distinct beginner words or native verification. All old IDs remain available as aliases. The known home locative is structurally normalized; this is one construction normalization, not a claim of widespread corrected translations.

The source report distinguishes missing/conflicting gender, source qualifiers and exclusion reasons. The original spelling, Roman text and translations are retained unless a safe duplicate match is established. Source Roman conventions vary, so complete standardized transliteration remains a review task. Frequency ranks remain unknown; university written-token statistics were researched but not redistributed because no open reuse grant was found.

The 30 construction-reviewed source nouns can enter supported direct-object patterns. Other new nouns, verbs and expressions are available for lookup, games and word flashcards. They remain outside sentence roles until their grammatical and semantic metadata are reviewed. Unknown gender is recorded as unknown. Every imported entry retains a fluent-review-pending status, including the small reviewed construction subset.

## Grammar enhancements

The existing generator remains in place. Its habitual, progressive, past progressive, ability, planned-future and infinitive helpers use the grammar engine. Supported patterns select subject/object agreement controllers, auxiliaries, authored obliques and compatible semantic tags. They preserve Punjabi SOV order and postpositions.

New finite-future support is deliberately bounded to **go, eat and do**, with authored person/gender/number paradigms. Fourteen verbs have authored perfective paradigms, including irregular go/come/eat/drink/do/give/take. Transitive perfectives agree with an unmarked object; a marked object uses the supported default masculine singular. Standard Eastern Punjabi first/second-person subjects omit overt ਨੇ, while supported third-person subjects use appropriate ergative phrases. Compound predicates and unlisted future/perfective forms are not guessed.

New verbs added through the editor begin disabled, with empty paradigms, until forms are authored and enabled. A new dictionary verb does not automatically become a conjugation-ready generator choice. Edits to reviewed imported lexical forms revoke unsafe approval. Source grammar references and the variation boundary are documented in `GRAMMAR_SOURCES.md`.

## Sentence templates

Original: **53 total / 46 enabled**. After: **65 total / 58 enabled**. Seven disabled legacy templates and custom templates remain preserved.

All 58 supported patterns have grammatical role metadata, word classes, agreement rules, semantic restrictions, tense/aspect, prerequisites, concept/scenario references and illustrative bilingual examples. Settings such as enabled flags, names and probabilities remain user-controlled. P47–P58 add:

| ID | Pattern |
| --- | --- |
| P47 | Finite future action with object |
| P48 | Finite future motion to a destination |
| P49 | Negative finite future |
| P50 | Finite future yes/no question |
| P51 | Completed transitive action |
| P52 | Completed motion from an origin |
| P53 | Present giving to a recipient |
| P54 | Completed giving to a recipient |
| P55 | Progressive motion from an origin |
| P56 | Going with a companion |
| P57 | Comparison using an authored noun phrase |
| P58 | Action using a compatible instrument |

Examples covered by tests include `ਮੈਂ ਖਾਣਾ ਖਾਂਦਾ ਹਾਂ।`, `ਉਹ ਖਾਣਾ ਖਾਂਦੀ ਹੈ।`, `ਅਸੀਂ ਖਾਣਾ ਖਾਂਦੇ ਹਾਂ।`, `ਮੈਂ ਖਾਣਾ ਖਾਵਾਂਗਾ।` and `ਉਸ ਨੇ ਰੋਟੀ ਖਾਧੀ।`. These software checks and reference comparison do not replace native review of generated usage.

## Feature integration

Vocabulary supports full-library search, parent/child topic selection, additional meanings, gender/word-class metadata, examples when authored, pronunciation, source attribution, add/edit/remove and bounded category rendering. A new record becomes discoverable without copying it into a separate game list.

The Word Game queries the same entries, supports their multiple topic memberships and retains old settings, scores, answers and FSRS cards. Flashcards retain sentence decks and add word decks by topic. Breakdown uses lexical IDs to connect sentence forms to dictionary entries. Pronunciation passes the same authored Gurmukhi to the existing speech client. The existing Firebase, cloud speech/backend, device voice, audio cache, saved sentence and saved word paths are retained.

## Future progression readiness

Vocabulary, grammar and communication have independent evidence maps with stable IDs. Vocabulary includes answer/exposure counters; grammar receives sentence-review evidence. Communication scenario requirements and future completion criteria are structured, but there is no automatic communication-mastery claim, unlock UI, adaptive recommendation system or full scenario lesson engine. Frequency, difficulty, grammar complexity, scenario difficulty and mastery are independent fields. Custom future concepts, scenarios and template prerequisites survive reconnecting.

The next phase can add reviewed lessons, richer recall measures, scenario assessments and recommendations using these relationships. Recognition and self-rating evidence should not be treated as demonstrated speaking fluency.

## Testing and limits

The complete automated suite passes **62 tests**, including the existing backend authentication/rate-limit/cache tests, existing FSRS/audio behavior, migration/edit/delete tests, source filtering, compact 5,000-record persistence, curated-subset eligibility, agreement/case constraints, canonical references and bilingual generation across all 58 patterns.

Browser checks use an unchanged original-app fixture modified with an existing saved sentence, saved word, user-edited translation, disabled word, custom noun and prior game answers. They verify central migration, all 58 templates, saving, custom-word discovery, word flashcards, a played written word-game round, reload and offline cached generation/browsing. There are no uncaught page errors.

- **desktop-chromium**: all 58 patterns generated; search interaction 32 ms; full check 7.09 seconds; offline cache verified by browser-offline.
- **iphone-webkit**: all 58 patterns generated; search interaction 37 ms; full check 6.78 seconds; offline cache verified by origin-server-stopped.

Playwright WebKit's network-offline reload produced an internal browser error; the successful WebKit cache test stops the local HTTP origin instead. The Chromium check uses browser network-offline mode. Neither is a physical iPhone installation test. Physical Safari, standalone installed iPhone PWA, real Google sign-in and live device/cloud pronunciation still need manual review on the user's configured devices/account; no paid API or production deployment was exercised. The existing speech/backend automated tests pass.

Manual linguistic validation in this change means comparison against cited primary grammar references and dictionary source metadata. A fluent Eastern Punjabi reviewer has not signed off the corpus or every generated combination. Regional choices, literary senses, transliteration conventions, topic tagging and unsupported advanced morphology remain explicitly documented limits. This is suitable for a draft review, not a claim that software tests establish complete linguistic correctness.

Machine-readable reports: `reports/baseline.json`, `reports/vocabulary-integration.json`, `data/vocabulary-import-report.json`, `reports/browser-check.json` and `reports/automated-tests.txt`.

## Vocabulary by grammatical classification

| Classification | Entries |
| --- | ---: |
| adjective | 791 |
| adverb | 237 |
| conjunction | 30 |
| determiner | 6 |
| expression | 66 |
| interjection | 44 |
| noun | 3,836 |
| numeral | 132 |
| particle | 9 |
| phrase | 8 |
| postposition | 31 |
| preposition | 20 |
| pronoun | 41 |
| verb | 408 |

## Vocabulary by thematic category

Entries can belong to several categories; category counts do not sum to the corpus total. Topic assignment is provisional.

| Category ID | Entries |
| --- | ---: |
| abstract | 78 |
| accommodation | 3 |
| actions | 406 |
| activities | 186 |
| airports | 8 |
| body | 199 |
| business | 45 |
| celebrations | 24 |
| clothing | 118 |
| culture | 213 |
| directions | 73 |
| disasters | 5 |
| education | 98 |
| emotions | 90 |
| essential | 75 |
| family | 170 |
| food | 211 |
| functional | 117 |
| general | 2,600 |
| goals | 38 |
| health | 255 |
| home | 109 |
| kitchen | 79 |
| medical | 53 |
| nature | 302 |
| numbers | 230 |
| opinions | 39 |
| people | 246 |
| places | 165 |
| problems | 26 |
| produce | 126 |
| professional | 18 |
| restaurants | 6 |
| romance | 22 |
| safety | 25 |
| shopping | 36 |
| social-media | 6 |
| society | 107 |
| sport | 23 |
| storytelling | 56 |
| technology | 18 |
| time | 172 |
| tourism | 6 |
| travel | 49 |
| weather | 47 |
| work | 94 |
