# Vocabulary cleanup audit — PR #10

Baseline: `de5527aded10b16d057aec904395d6113ad00f91` (merged PR #9). Three bounded passes: complete inventory, implementation, focused validation. No random sampling. All 3,111 active lexical records and every role binding were audited. All dictionary definitions, contextual/semantic parameters and known grammatical forms were fingerprinted for preservation checks.

| Measure | Before | After |
|---|---:|---:|
| Total active vocabulary / unique active records | 3,111 | 2,983 |
| All records retained for compatibility | 3,111 | 3,111 |
| WHAT Building Block | 3,676 | 3,350 |
| ABOUT Building Block | 1,240 | 1,212 |
| WHO Building Block | 209 | 204 |
| WHERE Building Block | 87 | 85 |
| WHEN Building Block | 82 | 77 |
| HOW Building Block | 42 | 41 |
| WHY Building Block | 32 | 29 |
| ADJECTIVE Building Block | 128 | 119 |
| STATE Building Block | 40 | 40 |
| VERBS Building Block | 146 | 138 |
| CONNECTOR Building Block | 15 | 15 |
| NUMBER Building Block | 21 | 21 |
| QUESTION Building Block | 14 | 14 |
| WORD Building Block | 3,111 | 2,983 |
| GAME_BODY reference rows | 30 | 30 |
| GAME_CLOTHES reference rows | 30 | 30 |
| GAME_EDUCATION reference rows | 30 | 30 |
| GAME_EVERYDAY reference rows | 30 | 30 |
| GAME_FRUITS reference rows | 30 | 30 |
| GAME_NATURE reference rows | 30 | 30 |
| GAME_SPICES reference rows | 30 | 30 |
| GAME_VEGETABLES reference rows | 30 | 30 |
| LEXICON internal bindings | 3,244 | 2,983 |
| Total Building Block rows (overlapping roles) | 8,843 | 8,328 |
| Exact redundant records | 5 | 0 |
| Equivalent redundant binding rows | 339 | 0 |
| Same-lemma consolidations completed in this PR | 0 | 32 |
| Synonym/translation-variant consolidations completed | 0 | 81 |
| Fringe records removed from active lists | 0 | 15 |
| Metadata records updated in this PR | 0 | 2,890 |

Counts describe a fresh repository-default library, not the user's browser. The reported browser counts (3,674 WHAT / 1,239 ABOUT) differ from repository main (3,676 / 1,240). A row is a word-sense/construction binding, not necessarily a distinct word. Roles overlap, so adding category counts does not count unique words. The eight GAME categories remain reference collections, not additional lexical datasets.

The five strictly exact redundancies are a subset of the 32 same-lemma consolidations, which also reconcile overlapping definitions, articles and Roman variants. The 81 alternative-word records and 15 fringe records leave active lists; all 128 original IDs remain available as compatibility records. Original Gurmukhi, Roman, English and dictionary senses remain available. There are no duplicate source IDs, unresolved original IDs, remaining exact active duplicates or unwanted equivalent bindings under the documented comparison rules.

2,890 distinct records changed at the lexical or binding level: 223 lexical metadata records and 2,888 records with binding changes, with overlap. This includes removals of redundant bindings and sense-specific vocabulary labels (3,580 labels), not 2,890 rewritten dictionary definitions. No original sense-metadata fingerprints or known grammatical forms changed.

## Authoritative sources and persistence

- Inline starter vocabulary/verbs in `index.html`, 240 game-reference rows in `game-vocabulary.js`, 5,184 dictionary rows in `data/vocabulary-expansion.js`, and 30 grammar-ready overrides feed the central registry. Source-evidence records supply dictionary evidence, not another visible inventory. Dictionary IDs are unique.
- PR #9's existing catalog policy excludes 2,469 records and consolidates 79 earlier records. Those prior actions are not counted as this PR's cleanup. The complete active baseline is 3,111 records, not all 5,184 raw imported rows.
- `state.linguistic.entries`, `bindings`, `aliases` and `tombstones` are authoritative at runtime. `state.vocab` and `state.verbs` are live compatibility views. Compact snapshots persist in `localStorage` under `punjabi-app-state-v1`. There is no vocabulary IndexedDB store or Firebase vocabulary synchronization in this path. Existing chunked local backups remain unchanged.
- Building Block Delete persists a category/binding tombstone; whole-word deletion persists an entry tombstone. New normalized lexical identity keys supplement IDs, so the same spelling/POS/meaning cannot return merely under a different imported ID. Available old tombstones migrate to this format. Other senses and other roles remain available when only one binding was deleted.
- Actual browser storage was unavailable. Specific manual deletions made by the user were not inspected and cannot be claimed preserved. Existing accessible tombstones are retained and tested. Cleared storage, another browser/device, or historic deletions with no remaining tombstone cannot be recovered. Deployments retaining the cleanup policy and local storage preserve exclusions; this introduces no account synchronization.

## Deterministic curation and safeguards

`vocabulary-cleanup-decisions.json` records 109 reviewed concept preferences, nine narrow equivalence families, 22 explicitly protected distinctions and 12 fringe-definition rules. It generates the browser policy using `node scripts/build-vocabulary-cleanup.js`.

Comparison uses NFC and whitespace/article/case normalization without changing original spellings or erasing Gurmukhi diacritics. Same spelling and POS alone are insufficient: meanings must overlap and all known paradigms must agree. Authored/stable IDs and complete evidence are preferred; additional source senses and Roman variants are retained. Distinct words retain their own paradigms in compatibility records, rather than receiving a replacement's forms.

Alternative-word consolidation requires a reviewed ordinary concept, covered dictionary senses, compatible gender/number distinctions and already-supported target roles. Words with additional uncovered senses remain active. Human feminine forms, plural forms, homographs, cultural distinctions, learner edits and phrase overrides are protected. A selected sense is retained on each surviving row; equivalent bindings consolidate only when their functional and semantic metadata agree. Sense labels are applied only when the existing selector returns the same outcome before and after the label change. Sentence rendering, grammatical construction, template selection and randomization rules are unchanged.

Compact source-ID and authored-role mappings reconstruct merged dictionary imports consistently. Startup cleanup waits for full sense/grammar enrichment. Repeated compact hydration has stable data, active IDs and category counts, without expanding the stored dictionary. An unchanged editor save does not turn a contextual label into a lexical edit.

Every record received a conservative learner-utility outcome: 527 authored/core, 979 useful intermediate, 1,590 less-common/context-specific or uncertain, and 15 fringe candidates in the baseline. These are development-time AI judgments supported by source definitions/domains, not observed usage-frequency rankings. No entry has measured frequency data. No fluent-speaker-review status was promoted. Unknown vocabulary was retained, not automatically deemed obscure.

## Ten redundancy examples

| Redundant record/rows | Canonical treatment |
|---|---|
| ਅੱਖ — “the eye” / “eye” | One ਅੱਖ lexical record; source senses retained. |
| ਨੱਕ — “the nose” / “nose” | One ਨੱਕ record; Roman variants retained. |
| ਮੋਢਾ — “The shoulder” / “shoulder” | Existing ਮੋਢਾ record retained. |
| ਇਮਤਿਹਾਨ — “an examination” / “exam” | One lemma with equivalent glosses preserved. |
| ਰਬੜ — “rubber (UK), eraser (US)” / “eraser” | Canonical ਰਬੜ retains dictionary clarification. |
| ਆਕਾਸ਼ — sky | Alternative retained inside canonical ਅਸਮਾਨ metadata. |
| ਆਸਮਾਨ — sky | Spelling alternative consolidated under ਅਸਮਾਨ. |
| ਤਾਕੀ — window | Ordinary window concept uses existing ਖਿੜਕੀ. |
| ਸਤਰੰਜ — chess | Canonical ਸ਼ਤਰੰਜ; ਚੌਸਰ remains distinct. |
| ਕਿਤਾਬ-ਘਰ — library | Ordinary library concept uses existing ਲਾਇਬ੍ਰੇਰੀ. |

ਅਦਬ illustrates why blindly collapsing English matches is unsafe: eight dictionary senses remain; its eight WHAT rows become five, consolidating politeness/courtesy/civility/urbanity while retaining respect, reverence, discipline and literature. Original definition text remains intact.

## Ten fringe-removal examples

| Entry | Reason for removal from active learning lists |
|---|---|
| ਇਤਿਹਾਸ ਪਦਾਰਥਵਾਦ — historical materialism | Specialized political-philosophical doctrine. |
| ਕਟਾਰ — katara dagger | Narrow weapon subtype; general/culturally useful weapon vocabulary remains. |
| ਕਣ ਭੌਤਿਕ ਵਿਗਿਆਨ — particle physics | Specialized academic subdiscipline. |
| ਕਿਲ੍ਹੇਦਾਰ — fort commander | Historical administrative/military office. |
| ਕੋਸ਼ਕਾਰੀ — lexicography | Specialized dictionary-compilation discipline. |
| ਖਗੋਲੀ ਇਕਾਈ — astronomical unit | Specialized scientific measurement. |
| ਗੁਪਤੀ — swordstick | Specific concealed-weapon concept. |
| ਚੂਲ — tenon | Specialized joinery component. |
| ਲਘੂਗਣਕ — logarithm | Specialized mathematical function. |
| ਸੁਰਮੀ — inferior antimony ore | Narrow mineral/ore terminology. |

The full 15-ID list, including alternate entries for the same specialist concepts and feudal-rank/system terms, is in `comparison.json`. Rules match the complete supplied definition set; they do not remove a common sense merely because another sense is specialist. Compatibility records remain available to saved content.

## Validation and remaining ambiguity

Focused tests cover registry behavior, contextual sense selection, learning context, game references, metadata migration, existing catalog integration and the new cleanup. Material migration regressions found during validation were fixed and only affected checks rerun. See `validation.json` for exact results and commands. No full application test suite/build/lint cycle was run.

All original record IDs resolve. Every original dictionary/semantic sense fingerprint and known grammatical form matches the baseline; original spellings and translations are unchanged. Canonical IDs are unique. Existing template contracts resolve; representative sentence patterns work. Game reference counts remain 30 per category. Category deletion, whole-word deletion under a new imported ID, user edits, saved content and repeated compact reloads are covered.

Shared glosses are still not proof of synonymy. For example, ਵਿਦਿਆਰਥਣ (female student), ਪੈਸਾ/ਪੈਸੇ, ਨਿਹਾਰੀ (dish), ਦਸਤਾਰ (cultural turban distinction), ਕਾਫ਼ੀ (additional literary/musical senses), ਖ਼ੁਰਾਕ (diet) and ਗੱਭਰੂ (additional relationship senses) remain. Potential source errors and regional/register choices were retained when reliable consolidation evidence was insufficient. This is a conservative curation, not a complete native-speaker or frequency certification.

Machine-readable `baseline.*` and `final.*` artifacts contain every active-baseline record, grammatical forms, sense IDs, semantic properties, role eligibility, bindings, aliases, references and duplicate relationships. `comparison.json` records every consolidation/removal ID and preservation result. Reproduce the source baseline with `node scripts/audit-vocabulary-cleanup.js baseline de5527aded10b16d057aec904395d6113ad00f91`, and the current inventory with `node scripts/audit-vocabulary-cleanup.js final`.
