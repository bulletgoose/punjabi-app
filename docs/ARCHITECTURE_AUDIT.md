# Repository audit and implemented architecture

Audited base commit `a2ecae18e075ba77ddc1c9d719deb25d8c038e8d` before importing additional vocabulary.

## Existing application

The app is an offline static application in `index.html`, with Firebase authentication and a separately configured speech backend. It has no root build dependency or paid infrastructure requirement.

| Source or feature | Before | Integration |
| --- | --- | --- |
| `defaultData`, `enrichData`, versioned state additions | Building Blocks and grammatical metadata embedded in HTML | Initial migration input; live role views read the registry afterward |
| `game-vocabulary.js` | 240 independent game-only rows | Preserved position IDs become aliases to canonical entries |
| Vocabulary and Word Game | 499 category rows; verbs excluded from game | Both query the canonical registry, including compatible verbs |
| Generator | Seven retained disabled legacy templates and 46 enabled patterns | All 58 supported patterns use shared entries and grammatical metadata |
| Flashcards | Generated sentences | Sentences preserved; word decks query the same registry |
| Sentence Breakdown | Authored phrases in two scripts and English | Adds canonical references, dictionary forms and grammatical explanations |
| App state | `punjabi-app-state-v1`, schema 5 | Same storage key, schema 6, linguistic schema 1; compact source references |
| Learning state | `punjabi-learning-v1` | Existing settings, scores, ratings and FSRS cards retained; independent progression evidence added |
| Other settings | Theme and automatic breakdown keys | Retained |
| Speech/audio | IndexedDB audio cache, cloud/device speech client | Existing cache and authentication behavior retained |
| PWA | v12 application-shell cache | v13 additionally caches dictionary, grammar, context, curated metadata and attribution |

Baseline measurement: 499 category rows plus 36 verbs = 535 lexical input records, with 53 templates total and 46 enabled. The per-category counts are in `reports/baseline.json`.

## Three connected systems

`linguistic-system.js` owns the authoritative runtime lexical registry. Persistent IDs, meanings, POS, gender, number, source provenance, frequency, difficulty and semantic compatibility belong to lexical entries. Homographs with different word classes or conflicting metadata remain distinct. Only safe matches are consolidated; every old identifier remains an alias.

Role bindings contain entry identifiers and contextual information. Nonenumerable compatibility views let the existing Building Blocks editor read and edit the same entries without storing another dictionary. The authored home expression is represented as `ghar/ਘਰ/home` plus a locative binding, which derives `ghar vich/ਘਰ ਵਿੱਚ`. Arbitrary custom phrases retain their authored forms.

`grammar-engine.js` owns constructions, agreement controllers, case phrases, finite forms and semantic constraints. It references the vocabulary rather than keeping a second lexical collection. Authored irregular paradigms are grammatical forms keyed by legacy aliases, with canonical references in generated sentences. Imported dictionary conjugation tables are not trusted.

`learning-context.js` owns thematic categories, grammar concepts and communication scenarios. Categories contain vocabulary ID references and independent parent relationships. Templates reference grammar concepts; scenarios reference vocabulary, concepts and templates. Frequencies, provisional difficulty and learner evidence remain separate.

## Persistence and migrations

The original app-state key remains stable. A recoverable `punjabi-app-state-before-linguistic-v1` copy is saved before existing repair migrations write. If the backup cannot be saved, the app clearly reports that new library edits cannot be persisted for that session.

The bundled dictionary is an offline baseline, not a second mutable feature dictionary. A compact snapshot persists original vocabulary, custom records, changes to imported entries, binding changes and deletion tombstones. Unchanged imported entries are reconstructed from the cached bundle. Saving the entire expanded dictionary would exceed common localStorage quotas; the measured compact pristine app state is approximately 393,000 characters. User content can still eventually fill finite browser storage, and the existing save-failure handling remains.

Legacy dictionary arrays are absent from persisted central state. Compatibility views support original editor push/filter/splice/enable operations. Imports never overwrite existing overrides or resurrect deleted rows. Editing reviewed imported words invalidates their sentence approval; unsupported grammatical roles are removed while dictionary practice and saved historical content remain.

Learner records stay in the separate learning-state key. Consolidated alias histories are retained without rewriting old answers: the display combines distinct answer counters, and scheduling uses the latest existing FSRS card. Vocabulary, grammar and communication evidence have independent maps.

## Implementation order

1. Audit original sources/storage and measure the baseline.
2. Implement and test registry, live views, identifiers and migrations.
3. Preserve and consolidate existing records.
4. Implement grammar and structured template changes.
5. Pass the architecture tests before exporting the bulk dictionary.
6. Export licensed source data and apply a small reviewed construction overlay.
7. Integrate browsing, games, flashcards, breakdown and offline resources.
8. Test real source volume, compact persistence, old-data fixtures and browser behavior.

No adaptive unlock policy, recommendation engine, paid service, deployment or merge is introduced.
