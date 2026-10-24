# Applied vocabulary review — 24 October 2026

Applied the completed review from the private Punjabi Vocabulary Review page. Source repository revision: `e4286432aebbd3f13caf1cc897cef78be6c3f91f`. Review completed: `2026-10-24T06:16:24.310Z`. Export SHA-256: `12e4e8dc37cd27e9bca4e74723cb2b9921a6e899e77734a3a3126068442ebfcc`.

- All **2,983** active records were reviewed: **1,421 Remove**, **1,562 Keep**, no unresolved decisions.
- The shipped active IDs exactly match the 1,562 Keep records. All 1,421 Remove records are excluded from every Building Block and the shared learning vocabulary, including game reference bindings where those specific records were marked Remove.
- **49** Keep records have explicit notes requesting removal of bracket explanations. Clean display meanings are stored separately from dictionary definitions. Nested and inline annotations are handled using the exact approved text, not a vocabulary-wide parentheses rule. The changes affect **160** displayed role labels and the English sentence display. Approved annotations are omitted after sense compatibility and ranking, so selection decisions and dictionary definitions remain unchanged.
- **17** previously consolidated alternatives of removed records remain excluded. This prevents a removed word from returning under a historical alternative ID during hydration.
- All **3,111** original PR #10 compatibility records remain addressable for saved content and progress. Dictionary meanings, sense IDs, semantic parameters, Gurmukhi/Roman fields and known grammatical forms are preserved. No template dependencies refer to a newly removed active binding.

| Category | Before | After |
|---|---:|---:|
| ABOUT | 1,212 | 767 |
| ADJECTIVE | 119 | 89 |
| CONNECTOR | 15 | 15 |
| GAME_BODY | 30 | 29 |
| GAME_CLOTHES | 30 | 26 |
| GAME_EDUCATION | 30 | 19 |
| GAME_EVERYDAY | 30 | 28 |
| GAME_FRUITS | 30 | 21 |
| GAME_NATURE | 30 | 25 |
| GAME_SPICES | 30 | 21 |
| GAME_VEGETABLES | 30 | 22 |
| HOW | 41 | 39 |
| LEXICON | 2,983 | 1,562 |
| NUMBER | 21 | 21 |
| QUESTION | 14 | 14 |
| STATE | 40 | 26 |
| VERBS | 138 | 123 |
| WHAT | 3,350 | 1,607 |
| WHEN | 77 | 74 |
| WHERE | 85 | 66 |
| WHO | 204 | 109 |
| WHY | 29 | 25 |
| WORD | 2,983 | 1,562 |

Rows overlap across roles. Unique active vocabulary is **2,983 → 1,562**. Total Building Block rows are **8,328 → 4,537**; game reference rows are **240 → 191**. The original import files are retained for dictionary evidence and compatibility; committed exclusions determine the active collection independently of browser-local deletion state.

## Bracket-note examples

| Original display | Approved display |
|---|---|
| jade (a gemstone) | jade |
| bank (financial institution) | bank |
| grandson (son's son) | grandson |
| doctor (one who practises diagnosis of disease and prescribes medicine) | doctor |
| for the time being, (as of) now, currently | for the time being, now, currently |
| worry, anxiety, concern, (+ ਕਰਨਾ (karnā)) to worry | worry, anxiety, concern, to worry |

`data/vocabulary-review-decisions.json` records every removed ID, the historical alternative mappings and all 49 original/cleaned labels with their notes. `scripts/build-vocabulary-cleanup.js` incorporates this review into the existing browser policy. Rebuilding or reimporting bundled vocabulary reapplies the exclusions. Original dictionary text and meaningful parentheses outside the approved word/annotation pairs remain intact. Learner-edited translation overrides are not overwritten by label cleanup.

## Focused validation

**53 tests passed** across:

- `tests/learner-vocabulary-review.test.js`: 5 tests covering exact Keep/Remove membership, all approved labels and original sense/form fingerprints, nested/inline annotations, migration of a PR #10 browser snapshot with saved content/progress, repeated reloads and representative existing sentence patterns.
- `tests/vocabulary-cleanup.test.js`: 9 tests covering metadata, compatibility IDs, manual deletion state, edited entries and hydration.
- `tests/sentence-catalog.test.js`: 14 tests covering existing catalog integrations, connectors, questions, numbers, saved references and disabled imported bindings.
- `tests/linguistic-system.test.js`: 23 registry tests.
- Two focused existing tests from `tests/context-aware-generation.test.js` verify dictionary-label handling, preservation of meaningful parentheses and article hints.

Initial reload checks discovered one historical black-pepper alternative being promoted after its canonical word was removed. The 17 existing alternative exclusions were made explicit, then only the four affected migration tests were rerun; all passed. Approved display-label and representative generation checks were also rerun after adding the post-selection display hook. Dataset-count assertions were updated to the learner-approved inventory. No full application suite, build or recursive vocabulary audit was run.

The review page remains the historical source of the decisions; its marks were read without changing them. This PR applies the decisions to the Punjabi app repository.
